function sandbox ()
{
    var _self = this;

    _self.init = function ()
    {
        window.addEventListener ('message', function (e) {
            switch (e.data.action)
            {
                case 'generate_hyperlinks':
                    var payload = JSON.parse (e.data.payload);
                    generate_hyperlinks (payload.jscode, payload.instances);
                    break;
            }

        }, false);

        window.parent.postMessage ({
            action: 'sandbox_ready',
            payload: null
        }, '*');
    };

    function generate_hyperlinks (jscode, instances)
    {
        var hg_str = "var hyperlink_generator = function (instance) {\n" +  jscode + "\n" + "}";
        eval (hg_str);

        var new_instances = [];
        for (var i = 0; i < instances.length; i++)
        {
            var ins = instances[i];

            ins.links = hyperlink_generator (ins);
            new_instances.push (ins);
        }

        window.parent.postMessage ({
            action: 'hyperlinks_generated',
            payload: JSON.stringify (new_instances)
        }, '*');
    }

    return _self;
}

document.addEventListener("DOMContentLoaded", function(event) {
    var s = new sandbox ();
    s.init ();
});