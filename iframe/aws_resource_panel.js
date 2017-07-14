function aws_resource_panel () {
    var _self = this;
    var _resource_info = null;

    var _settings = null;

    _self.init = function (settings)
    {
        _settings = settings;

        console.log ("[aws_resource_panel.init] settings: ", settings);
        _resource_info = new aws_resource_info ();
        _resource_info.init (_settings);

        load_settings_form ();

        $('#modal-aws-settings').on ('hide.bs.modal', on_hide_settings_modal);

        _resource_info.list_instances (function (instances) {
            console.log ("[aws_resource_panel.init] reloading " + instances.length + " instances...");
            reload_instances (instances);
        });
    };

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
    }

    function load_settings_form () {
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

    function reload_instances (instances)
    {
        var div = $("<div />", {
            'role': 'tablist',
            'aria-multiselectable': 'true',
            'id': 'instances-collapse'
        });

        for (var i = 0; i < instances.length; i++)
        {
            var ins = instances[i];

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
                //'data-parent': '#instances-collapse',
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

            details = $('<p>'
                + ins.instance_id + '<br />'
                + ins.instance_type + '<br />'
                + ins.private_ip_address + '<br />'
                + ins.state + '<br />'
                + '<a href="ssh://' + ins.private_ip_address + '/">ssh</a><br />'
                + '</p>');

            e2.append (details);
            e1.append (e2);
            e.append (e1);

            div.append(e);
        }

        $('#resources').empty ();
        $('#resources').append (div);
    }




    return _self;
}