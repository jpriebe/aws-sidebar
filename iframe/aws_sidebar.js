function aws_sidebar ()
{
    var _self = this;

    var _settings = null;
    var _console_panel = null;
    var _pricing_panel = null;
    var _instances_panel = null;

    init ();

    function init ()
    {
        set_message_listener ();

        console.log ("[init] calling get_settings...");
        window.parent.postMessage({
            action: 'get_settings',
            payload: null
        }, '*');
    }


    function on_selected_cservices_changed (selected)
    {
        _settings.sync.selected_cservices = selected;
        save_settings ();
    }

    function on_selected_pservices_changed (selected)
    {
        _settings.sync.selected_pservices = selected;
        save_settings ();
    }



    function save_settings ()
    {
        window.parent.postMessage ({
            action: 'save_settings',
            payload: _settings
        }, '*');
    }


    function on_button_close_click ()
    {
        window.parent.postMessage ({
            action: 'close_sidebar',
            payload: null
        }, '*');
    }

    function init_ui ()
    {
        console.log ("[init_ui] entering...");
        $('#button-close').click (on_button_close_click);

        _instances_panel = new aws_instances_panel ();

        $('#tab-instances').on('shown.bs.tab', function (e) {
            _instances_panel.init (_settings);
        });

        console.log ("[init_ui] setting sticky tabs...");

        // make tabs sticky
        // https://stackoverflow.com/questions/10523433/how-do-i-keep-the-current-tab-active-with-twitter-bootstrap-after-a-page-reload
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            // save the latest tab; use cookies if you like 'em better:
            localStorage.setItem('lastTab', $(this).attr('href'));
        });

        // go to the latest tab, if it exists:
        var lastTab = localStorage.getItem('lastTab');
        if (lastTab) {
            $('[href="' + lastTab + '"]').tab('show');
        }

        // filter out the service listings that have pricing info
        var pricing_services = [];
        for (var i = 0; i < all_services.length; i++)
        {
            if (!all_services[i][3])
            {
                continue;
            }

            pricing_services.push ([
                all_services[i][0],
                all_services[i][1],
                all_services[i][3]
            ]);
        }

        _console_panel = new link_listgroup_panel (all_services, _settings.sync.selected_cservices, on_selected_cservices_changed, '#selected-cservices', '#form-select-cservices');
        _pricing_panel = new link_listgroup_panel (pricing_services, _settings.sync.selected_pservices, on_selected_pservices_changed, '#selected-pservices', '#form-select-pservices');

        console.log ("[init_ui] done.");
    }

    function set_message_listener ()
    {
        window.addEventListener ('message', function (e) {
            switch (e.data.action)
            {
                case 'get_settings_result':
                    _settings = e.data.payload;
                    console.log ("[get_settings_result] got settings", _settings);

                    init_ui ();
                    break;
            }
        }, false);
    }


    return _self;
}


$(function () {
    var s = new aws_sidebar ();
});

