function settings_manager () {
    var _self = this;

    var _settings = {
        'sync': {
            selected_services: [],
            selected_pservices: []
        },
        'local': {

        }
    };

    _self.init = function (callback)
    {
        chrome.storage.sync.get ('settings', function (items) {
            if (typeof items.settings !== 'undefined')
            {
                console.log ('[settings_manager.init] sync settings loaded', items);
                $.extend (true, _settings.sync, items.settings);
            }

            chrome.storage.local.get ('settings', function (items){
                if (typeof items.settings !== 'undefined')
                {
                    console.log ('[settings_manager.init] local settings loaded', items);
                    $.extend (true, _settings.local, items.settings);
                }

                set_message_listener ();
                callback ();
            });
        });
    };


    function set_message_listener ()
    {
        window.addEventListener ('message', function (e) {
            switch (e.data.action)
            {
                case 'get_settings':
                    e.source.postMessage ({
                        action: 'get_settings_result',
                        payload: _settings
                    }, '*');
                    break;

                case 'save_settings':
                    _self.save_settings (e.data.payload);
                    break;
            }
        }, false);
    }

    _self.get_settings = function ()
    {
        return _settings;
    };

    _self.save_settings = function (s)
    {
        console.log ("[save_settings] saving settings...");
        chrome.storage.sync.set ({ 'settings' : s.sync }, function () {
            if (typeof chrome.runtime.lastError !== 'undefined')
            {
                console.log ('[settings_manager.save_settings] Error saving sync settings: ' + chrome.runtime.lastError);
            }
            else
            {
                console.log ('[settings_manager.save_settings] sync settings saved successfully.');
            }
        });
        chrome.storage.local.set ({ 'settings' : s.local }, function () {
            if (typeof chrome.runtime.lastError !== 'undefined')
            {
                console.log ('[settings_manager.save_settings] Error saving local settings: ' + chrome.runtime.lastError);
            }
            else
            {
                console.log ('[settings_manager.save_settings] local settings saved successfully.');
            }
        });
    };

    return _self;
}
