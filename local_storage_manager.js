function local_storage_manager () {
    var _self = this;

    _self.init = function ()
    {
        set_message_listener ();
    };


    function set_message_listener ()
    {
        window.addEventListener ('message', function (e) {
            switch (e.data.action)
            {
                case 'ls_get_item':
                    var item = localStorage.getItem (e.data.payload);

                    var result = {
                        key: e.data.payload,
                        value: item
                    };

                    e.source.postMessage ({
                        action: 'ls_get_item_result',
                        payload: result
                    }, '*');
                    break;

                case 'ls_set_item':
                    localStorage.setItem (e.data.payload[0], e.data.payload[1]);
                    break;
            }
        }, false);
    }

    return _self;
}
