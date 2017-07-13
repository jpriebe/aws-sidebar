var _settings = {
    selected_services: [],
    selected_pservices: [],
};

var _ui_settings = {
    sidebar_open: false
};

var _aws_tab = null;
var _aws_sidebar = null;
var _aws_iframe = null;

var _sidebar_positions = {
    open: "0px",
    closed: "-700px"
};
var _tab_positions = {
    open: "-25px",
    closed: "0px"
};

$(document).ready (function () {
    var EXCLUDE = /\.(xml|txt|jpg|png|avi|mp3|pdf|mpg)$/;

    function init ()
    {
        // don't run on frames or iframes.
        // from http://stackoverflow.com/questions/1535404/how-to-exclude-iframe-in-greasemonkey
        if (window.top != window.self)
        {
            return;
        }

        if (!window.location.href.match (/aws\.amazon\.com/))
        {
            return;
        }

        chrome.storage.local.get ('ui_settings', function (items) {
            if (typeof items.ui_settings !== 'undefined')
            {
                console.log ('[init] ui settings loaded', items);
                _ui_settings = items.ui_settings;
            }

            chrome.storage.sync.get ('settings', function (items) {
                if (typeof items.settings !== 'undefined')
                {
                    console.log ('[init] settings loaded', items);
                    load_settings (items.settings);
                }

                setMessageListener ();
                create_sidebar ();

            });
        });
    }
    
    function load_settings (s)
    {
        if (typeof s.selected_services !== 'undefined')
        {
            _settings.selected_services = s.selected_services;
        }
        if (typeof s.selected_pservices !== 'undefined')
        {
            _settings.selected_pservices = s.selected_pservices;
        }
    }

    function setMessageListener ()
    {
        window.addEventListener ('message', function (e) {
            switch (e.data.action)
            {
                case 'get_settings':
                    iframe_get_settings ();
                    break;
                case 'save_settings':
                    _settings = e.data.payload;
                    save_settings ();
                    break;
                case 'close_sidebar':
                    toggle_sidebar();
                    break;
            }
        }, false);
    }

    function iframe_get_settings ()
    {
        console.log ("[iframe_get_settings] sending settings to iframe...");
        var e = document.getElementById ('AWScontent');
        e.contentWindow.postMessage ({
            action: 'get_settings_result',
            payload: _settings
        }, '*');
    }

    function save_settings ()
    {
        console.log ("[save_settings] saving settings...");
        chrome.storage.sync.set ({ 'settings' : _settings }, function () {
            if (typeof chrome.runtime.lastError !== 'undefined')
            {
                console.log ('[save_settings] Error saving settings: ' + chrome.runtime.lastError);
            }
            else
            {
                console.log ('[save_settings] settings saved successfully.');
            }
        });
    }

    function save_ui_settings ()
    {
        console.log ("[save_ui_settings] saving settings...");
        chrome.storage.local.set ({ 'ui_settings' : _ui_settings }, function () {
            if (typeof chrome.runtime.lastError !== 'undefined')
            {
                console.log ('[save_ui_settings] Error saving settings: ' + chrome.runtime.lastError);
            }
            else
            {
                console.log ('[save_ui_settings] settings saved successfully.');
            }
        });
    }

    function create_sidebar (AWSurl, title)
    {
        if ($("#AWSsidebar").length > 0)
        {
            return;
        } // avoid situations where multiple results might be triggered.

        _aws_sidebar = $("<div />").attr ({'id': 'AWSsidebar'});

        _aws_iframe = $("<iframe />").attr ({
            'id': 'AWScontent',
            'src': chrome.extension.getURL ('iframe/index.html'),
            'style': 'border: none'
        });
        _aws_sidebar.append (_aws_iframe);


        $(window).resize (fix_iframe_height);

        _aws_tab = $("<div><img src=\""
                + chrome.extension.getURL ("images/tab.png")
                + "\" srcset=\"" + chrome.extension.getURL ("images/tab.png") + " 1x,"
                + chrome.extension.getURL ("images/tab-2x.png") + " 2x"
                + "\" alt=\"AWS Sidebar\" /></div>").attr ({'id': 'AWStab'});

        _aws_tab.click (toggle_sidebar);

        if (_ui_settings.sidebar_open)
        {
            fix_iframe_height();
            console.log ("[create_sidebar] ui settings: sidebar open");
            _aws_tab.css ({ right:_tab_positions['open'] });
            _aws_sidebar.css ({ right:_sidebar_positions['open'] });
            _aws_tab.hide ();
            _aws_sidebar.show ();
        }
        else
        {
            console.log ("[create_sidebar] ui settings: sidebar closed");
            _aws_tab.css ({ right: _tab_positions['closed'] });
            _aws_sidebar.css ({ right:_sidebar_positions['closed'] });
            _aws_tab.show ();
            _aws_sidebar.hide ();
        }

        $('body').append (_aws_tab);
        $('body').append (_aws_sidebar);

        var fs = document.createElement('style');
        fs.type = 'text/css';
        fs.textContent = '@font-face { font-family: aws-sidebar; src: url("'
            + chrome.extension.getURL('fonts/aws-sidebar.woff')
            + '"); }';
        document.head.appendChild(fs);
    }

    function fix_iframe_height () {
        _aws_sidebar.height ($(window).height ());
        _aws_iframe.height (_aws_sidebar.height ());
    }


    function toggle_sidebar () {
        var open_sidebar = _aws_tab.is (":visible");

        var easing = "swing",
            tab_animation_time = 50,
            sidebar_animation_time = 100;

        if (open_sidebar)
        {
            fix_iframe_height ();
            _aws_tab.animate ({right: _tab_positions['open']}, tab_animation_time, easing, function () {
                _aws_tab.hide ();
            });
            _aws_sidebar.show ();
            _aws_sidebar.animate ({right: _sidebar_positions['open']}, sidebar_animation_time, easing);

            _ui_settings.sidebar_open = true;
        }
        else
        {
            _aws_sidebar.animate ({right: _sidebar_positions['closed']}, sidebar_animation_time, easing, function () {
                _aws_sidebar.hide ();
            });
            _aws_tab.show ();
            _aws_tab.animate ({right: _tab_positions['closed']}, tab_animation_time, easing);

            _ui_settings.sidebar_open = false;
        }

        save_ui_settings();
    }

    init ();

});
