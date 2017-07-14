function aws_resource_info () {
    var _self = this;
    var _instances = [];
    var _instance_timestamp = 0;

    // this filter governs which instances we will actually keep
    var _data_tag_filter = '';
    var _data_state_filter = '';

    _self.init = function (settings)
    {
        console.debug ("[init] entering...");

        AWS.config.region = settings.sync.aws_region;
        AWS.config.credentials = new AWS.Credentials ({
            accessKeyId: settings.local.aws_access_key_id,
            secretAccessKey: settings.local.aws_secret_access_key
        });

        _data_tag_filter = settings.sync.instance_tag_filter;
        _data_state_filter = settings.sync.instance_state_filter;
    };

    function test_tag_filter (filter, instance)
    {
        // @todo - validation of filter syntax?
        var filters = filter.split (";");

        for (var i = 0; i < filters.length; i++)
        {
            var kv = filters[i].split ("=");
            var tag = kv[0];
            var regex = kv[1];

            var re = new RegExp(regex, "g");

            console.debug (" - tag[" + tag + "] '" + instance.tags[tag] + "' =~ " + re);
            if (typeof instance.tags[tag] === 'undefined')
            {
                console.debug ("   tag not defined");
                return false;
            }

            if (!re.test (instance.tags[tag]))
            {
                console.debug ("   no match");
                return false;
            }
            else
            {
                console.debug ("   match");
            }
        }

        console.debug ("   instance passes tag filter.");
        return true;
    }

    function test_state_filter (states, instance)
    {
        var re = new RegExp("^(" + states.join ('|') + ")$", "g");

        console.debug (" - instance state '" + instance.state + "' =~ " + re);

        if (re.test (instance.state))
        {
            console.debug ("   match");
            return true;
        }

        console.debug ("   no match");
        return false;
    }

    _self.list_instances = function (callback)
    {
        var ec2 = new AWS.EC2();

        // @TODO - save instances and timestamp somewhere that they can survive a page reload
        if (_instance_timestamp > Date.now() - 300000)
        {
            callback (_instances);
            return;
        }

        console.debug ("[list_instances] describeInstances()...");

        ec2.describeInstances({}, function(err, data) {
            if (err) return console.debug(err, err.stack);

            _instances = [];
            for (var i in data.Reservations) {
                var info = {};

                var ins = data.Reservations[i].Instances[0];
                info.instance_id = ins.InstanceId;
                info.state = ins.State.Name;
                info.instance_type = ins.InstanceType;
                info.private_ip_address = ins.PrivateIpAddress;

                info.tags = {};
                for(var j in ins.Tags){
                    info.tags[ins.Tags[j].Key] = ins.Tags[j].Value;
                }

                info.name = (typeof info.tags['Name'] === 'undefined') ? '<unknown>' : info.tags['Name'];

                console.debug ("testing instance: ", ins);
                if (test_tag_filter (_data_tag_filter, info) && test_state_filter (_data_state_filter, info))
                {
                    console.debug ("keeper");
                    _instances.push (info);
                }
            }

            console.debug ("sorting " + _instances.length + " instances...");
            _instances.sort (function (a, b) {
                var nameA = a.name.toUpperCase(); // ignore upper and lowercase
                var nameB = b.name.toUpperCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                    return -1;
                }
                if (nameA > nameB) {
                    return 1;
                }

                // names must be equal
                return 0;
            });

            callback (_instances);
        });
    };

    return _self;
}