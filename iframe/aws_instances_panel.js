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
        console.log ("[aws_instances_panel.init] settings: ", settings);

        if (!_initialized)
        {
            _settings = settings;

            $('#modal-aws-settings').on ('hide.bs.modal', on_hide_settings_modal);

            $('#instances-filter').keyup(function() {
                delay(function(){
                    filter_instances ();
                }, 1000 );
            });

            load_settings_form ();
            _initialized = true;
        }

        reset_aws_info();
    };

    function reset_aws_info ()
    {
        _aws_info = new aws_info ();
        _aws_info.init (_settings);
        _aws_info.list_instances (function (instances) {
            _instances = instances;
            console.log ("[aws_instances_panel.init] reloading " + instances.length + " instances...");
            reload_instances ();
        });
    }

    function on_hide_settings_modal ()
    {
        _settings.local.aws_access_key_id = $('#access_key_id').val ();
        _settings.local.aws_secret_access_key = $('#secret_access_key').val ();

        _settings.sync.aws_region = $('#aws_region').val ();
        _settings.sync.instance_tag_filter = $('#instance_tag_filter').val ();

        _settings.sync.instance_state_filter = [];
        $.each($("input[name='instance_state_filter']:checked"), function(){
            _settings.sync.instance_state_filter.push ($(this).val());
        });

        window.parent.postMessage ({
            action: 'save_settings',
            payload: _settings
        }, '*');

        reset_aws_info ();
    }

    function load_settings_form ()
    {
        $('#access_key_id').val (_settings.local.aws_access_key_id);
        $('#secret_access_key').val (_settings.local.aws_secret_access_key);

        $('#aws_region').val (_settings.sync.aws_region);
        $('#instance_tag_filter').val (_settings.sync.instance_tag_filter);

        $(":checkbox[name='instance_state_filter']").attr('checked', false);
        for (var i = 0; i < _settings.sync.instance_state_filter.length; i++)
        {
            var state = _settings.sync.instance_state_filter[i];
            $(":checkbox[name='instance_state_filter'][value='" + state + "']").attr('checked', true);
        }
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


    function reload_instances ()
    {
        var div = $("<div />", {
            'role': 'tablist',
            'aria-multiselectable': 'true',
            'id': 'instances-collapse'
        });

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

            var name = ins.name;

            details = $('<p class="instance-details-header">'
                + ins.private_ip_address + ' &middot; '
                + ins.instance_type + ' &middot; '
                + ins.state + '</p>');

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

            detail_str += '</table>'
                + '<a href="ssh://' + ins.private_ip_address + '/">ssh</a><br />';

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