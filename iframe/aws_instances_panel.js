function aws_instances_panel () {
    var _self = this;
    var _aws_info = null;
    var _initialized = false;

    var _instances = [];
    var _instance_filter = null;

    var _settings = null;

    var delay = (function(){
        var timer = 0;
        return function(callback, ms){
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
        };
    })();

    _self.init = function (settings)
    {
        console.debug ("[aws_instances_panel.init] settings: ", settings);

        if (!_initialized)
        {
            _settings = settings;

            $('#instances-filter').keyup(function() {
                delay(function(){
                    filter_instances ();
                }, 1000 );
            });

            $('#instance_tag_filter').keyup(function() {
                delay(function(){
                    validate_regex ();
                }, 1000 );
            });

            $('#modal-aws-settings').on ('hide.bs.modal', on_hide_settings_modal);

            $('#btn-close-aws-settings').click (function () {
                console.debug ("[aws_instances_panel] settings close button clicked...");
                if (validate_regex ())
                {
                    console.debug ("[aws_instances_panel] validated regex(es); hiding modal");
                    $('#modal-aws-settings').modal ('hide');
                }
            });

            setup_sandbox();
        }
    };

    function finish_init ()
    {
        load_settings_form ();
        _initialized = true;

        _aws_info = new aws_info ();
        _aws_info.init (_settings);

        reset_aws_info ();
    }

    function setup_sandbox ()
    {
        window.addEventListener ('message', function (e) {
            switch (e.data.action)
            {
                case 'sandbox_ready':
                    finish_init ();
                    break;

                case 'hyperlinks_generated':
                    var instances = JSON.parse (e.data.payload);
                    render_instances (instances);
                    break;
            }

        }, false);

        var sandbox_iframe = $("<iframe />").attr ({
            'id': 'sandbox',
            'src': chrome.extension.getURL ('iframe/sandbox.html'),
            'style': 'border: none'
        });
        $('#sandbox-placeholder').append (sandbox_iframe);
    }

    function validate_regex ()
    {
        try
        {
            var filter = $('#instance_tag_filter').val ();
            var filters = filter.split (";");
            for (var i = 0; i < filters.length; i++)
            {
                var kv = filters[i].split ("=");
                var regex = new RegExp(kv[1]);
            }
        }
        catch (error)
        {
            $('#fg_instance_tag_filter').addClass ('has-danger');
            var msg = "Invalid regex syntax '" + kv[1] + "'";
            $('#instance_tag_filter_feedback').text (msg);
            return false;
        }

        $('#fg_instance_tag_filter').removeClass ('has-danger');
        $('#instance_tag_filter_feedback').text ('');

        return true;
    }

    function reset_aws_info (ignore_cache)
    {
        if (typeof ignore_cache === 'undefined')
        {
            ignore_cache = false;
        }

        _aws_info.list_instances (function (instances) {
            _instances = instances;
            console.log ("[aws_instances_panel.init] reloading " + instances.length + " instances...");
            reload_instances ();
        }, ignore_cache);
    }

    function on_hide_settings_modal (e)
    {
        console.debug ("[aws_instances_panel.on_hide_settings_modal] entering...");
        _settings.local.aws_access_key_id = $('#access_key_id').val ();
        _settings.local.aws_secret_access_key = $('#secret_access_key').val ();

        _settings.sync.aws_region = $('#aws_region').val ();

        _settings.sync.instance_tag_filter = $('#instance_tag_filter').val ();

        _settings.sync.instance_state_filter = [];
        $.each($("input[name='instance_state_filter']:checked"), function(){
            _settings.sync.instance_state_filter.push ($(this).val());
        });

        _settings.sync.hyperlink_generator = $('#hyperlink_generator').val ();

        window.parent.postMessage ({
            action: 'save_settings',
            payload: _settings
        }, '*');

        _aws_info = new aws_info ();
        _aws_info.init (_settings);

        reset_aws_info (true);
    }

    function load_settings_form ()
    {
        $('#access_key_id').val (_settings.local.aws_access_key_id);
        $('#secret_access_key').val (_settings.local.aws_secret_access_key);

        $('#aws_region').val (_settings.sync.aws_region);
        $('#instance_tag_filter').val (_settings.sync.instance_tag_filter);

        $(":checkbox[name='instance_state_filter']").attr('checked', false);

        if (typeof _settings.sync.instance_state_filter !== 'undefined')
        {
            for (var i = 0; i < _settings.sync.instance_state_filter.length; i++)
            {
                var state = _settings.sync.instance_state_filter[i];
                $(":checkbox[name='instance_state_filter'][value='" + state + "']").attr('checked', true);
            }
        }

        $('#hyperlink_generator').val (_settings.sync.hyperlink_generator);

    }

    function filter_instances ()
    {
        var filter_string = $('#instances-filter').val ().trim ();

        if (filter_string === '')
        {
            _instance_filter = null;
        }
        else
        {
            _instance_filter = new RegExp(filter_string);
        }

        reload_instances ();
    }

    function filter_instance (ins)
    {
        var test_string = ins.name + " " + ins.instance_type + " " + ins.az;
        for (var key in ins.Tags)
        {
            test_string += " " + ins.Tags[key];
        }

        return _instance_filter.test (test_string);
    }


    function reload_instances () {

        var display_instances = [];
        for (var i = 0; i < _instances.length; i++)
        {
            var ins = _instances[i];

            if (_instance_filter !== null)
            {
                if (!filter_instance (ins))
                {
                    continue;
                }
            }

            display_instances.push (ins);
        }

        if (_settings.sync.hyperlink_generator)
        {
            var sandbox = document.getElementById( 'sandbox' );
            sandbox.contentWindow.postMessage ({
                action: 'generate_hyperlinks',
                payload: JSON.stringify ({
                    'jscode': _settings.sync.hyperlink_generator,
                    'instances': display_instances
                })
            }, '*');
        }
        else
        {
            render_instances (display_instances);
        }
    }

    function render_instances (instances)
    {
        var div = $("<div />", {
            'role': 'tablist',
            'aria-multiselectable': 'true',
            'id': 'instances-collapse'
        });

        for (var i = 0; i < instances.length; i++)
        {
            var ins = instances[i];

            if (_instance_filter !== null)
            {
                if (!filter_instance (ins))
                {
                    continue;
                }
            }

            var name = ins.name;

            var detail_fields = [];
            if (typeof ins.private_ip_address !== 'undefined')
            {
                detail_fields.push (ins.private_ip_address);
            }
            detail_fields.push (ins.instance_type);
            detail_fields.push (ins.state);

            details = $('<p class="instance-details-header">'
                    + detail_fields.join (' &middot; ')
                    + '</p>');

            var e = $('<div>', { 'class': 'card small-card' })
            var e1 = $('<div>', { 'class': 'card-header', 'role': 'tab', 'id': 'collapse-heading-' + i, });
            var e2 = $('<h5>', { 'class': 'mb-0' });
            var e3 = $('<a>', {
                'data-toggle': 'collapse',
                'href': '#collapse-' + i,
                'aria-expanded': 'false',
                'aria-controls': 'collapse-' + i,
                'text': name
            });

            e2.append (e3);
            e1.append (e2);
            e1.append (details);
            e.append (e1);

            e1 = $('<div>', {
                'id': 'collapse-' + i,
                'class': 'collapse',
                'role': 'tabpanel',
                'aria-labelledby': 'collapse-heading-' + i
            });
            e2 = $('<div>', {
                'class': 'card-block'
            });

            var detail_str = '<table class="table">'
                + '<tr><td><strong>Id</strong></td><td>'
                + '<a href="https://console.aws.amazon.com/ec2/v2/home#Instances:search='
                + ins.instance_id + '" target="_top">'
                + ins.instance_id + '</a></td></tr>'
                + '<tr><td><strong>AMI</strong></td><td>'
                + '<a href="https://console.aws.amazon.com/ec2/v2/home#Images:search='
                + ins.image_id + '" target="_top">'
                + ins.image_id + '</a></td></tr>'
                + '<tr><td><strong>Launched</strong></td><td>'
                + moment(ins.launch_time).format('YYYY-MM-DD HH:mm:ss ZZ')
                + '</td></tr>'
                + '<tr><td><strong>AZ</strong></td><td>' + ins.az + '</td></tr>';

            if (ins.asg)
            {
                detail_str += '<tr><td><strong>ASG</strong></td><td>'
                    + '<a href="https://console.aws.amazon.com/ec2/autoscaling/home?#AutoScalingGroups:id='
                    + ins.asg + '" target="_top">'
                    + ins.asg + '</a></td></tr>';
            }

            detail_str += '<tr><td><strong>Private IP</strong></td><td>' + ins.private_ip_address + '</td></tr>';

            if (ins.public_ip_address)
            {
                detail_str += '<tr><td><strong>Public IP</strong></td><td>' + ins.public_ip_address + '</td></tr>';
            }

            detail_str += '<tr><td><strong>Tags</strong></td><td>';

            var xary = [];
            for (var key in ins.tags)
            {
                xary.push (key + "=" + ins.tags[key]);
            }
            detail_str += xary.join ('<br />');

            detail_str += '</td></tr>';

            detail_str += '<tr><td><strong>Security Groups</strong></td><td>';

            var xary = [];
            for (var j = 0; j < ins.security_groups.length; j++)
            {
                var id = ins.security_groups[j].id;
                var name = ins.security_groups[j].name;

                var link = '<a href="https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:search='
                    + id + '" target="_top">' + name + "</a>";
                xary.push (link);
            }
            detail_str += xary.join ('<br />');

            detail_str += '</td></tr>';

            detail_str += '</table>';


            if ((typeof ins.links !== 'undefined') && (ins.links.length > 0))
            {
                detail_str += "<strong>Links</strong>: " + ins.links.join (" &middot; ") + "<br />\n";
            }

            details = $(detail_str);

            e2.append (details);
            e1.append (e2);
            e.append (e1);

            div.append(e);
        }

        $('#instances').empty ();
        $('#instances').append (div);
    }


    return _self;
}