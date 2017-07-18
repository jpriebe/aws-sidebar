function aws_info (instance_cache) {
    var _self = this;
    var _instances = [];
    var _instance_timestamp = 0;

    var _fully_configured = false;

    // this filter governs which instances we will actually keep
    var _data_tag_filter = '';
    var _data_state_filter = '';

    _self.init = function (settings)
    {
        console.debug ("[aws_info.init] entering...");

        AWS.config.region = settings.sync.aws_region;
        AWS.config.credentials = new AWS.Credentials ({
            accessKeyId: settings.local.aws_access_key_id,
            secretAccessKey: settings.local.aws_secret_access_key
        });

        if (settings.sync.aws_region && settings.local.aws_access_key_id && settings.local.aws_secret_access_key)
        {
            _fully_configured = true;
        }

        _data_tag_filter = settings.sync.instance_tag_filter;
        _data_state_filter = settings.sync.instance_state_filter;
    };

    function test_tag_filter (filter, instance)
    {
        filter = filter.trim ();
        var filters = [];

        if (filter !== '')
        {
            filters = filter.split (";");
        }

        console.debug ("[aws_info.test_tag_filter] testing tag filter '" + filter + "'; filters: ", filters);

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

    _self.list_instances = function (callback, ignore_cache)
    {
        console.debug ("[aws_info.list_instances] entering...");

        if (!_fully_configured)
        {
            console.log ("[aws_info.list_instances] not fully configured; returning empty array");
            callback ([]);
            return;
        }

        if (typeof ignore_cache === 'undefined')
        {
            ignore_cache = false;
        }

        var ec2 = new AWS.EC2();

        if (ignore_cache)
        {
            console.log ("[aws_info.list_instances] ignore_cache = true");
            _instances = [];
            _instance_timestamp = 0;
        }

        //console.debug ("[aws_info.list_instances] _instance_timestamp: ", _instance_timestamp);
        //console.debug ("[aws_info.list_instances] _instances: ", _instances);

        if (!ignore_cache)
        {
            var instance_cache = localStorage.getItem ('instance_cache');

            if (instance_cache)
            {
                try
                {
                    instance_cache = JSON.parse (instance_cache);
                }
                catch (e)
                {
                    instance_cache = null;
                }
            }

            // console.debug ("[aws_info.list_instances] instance_cache: ", instance_cache);

            if (instance_cache && (typeof instance_cache.timestamp !== 'undefined'))
            {
                _instance_timestamp = instance_cache.timestamp;
                _instances = instance_cache.instances;
            }
            else
            {
                _instances = [];
                _instance_timestamp = 0;
            }
        }
        else
        {
            console.log ("[aws_info.list_instances] ignore_cache = true");
        }

        if (_instance_timestamp > Date.now() - 300000)
        {
            console.log ("[aws_info.list_instances] using cached instance data");
            callback (_instances);
            return;
        }

        console.log ("[aws_info.list_instances] retrieving instance data from EC2...");

        ec2.describeInstances({}, function(err, data) {
            if (err) return console.debug(err, err.stack);

            _instances = [];
            for (var i in data.Reservations) {
                var info = {};

                var ins = data.Reservations[i].Instances[0];

                //console.log ("instance: ", ins);

                info.instance_id = ins.InstanceId;
                info.state = ins.State.Name;
                info.instance_type = ins.InstanceType;
                info.private_ip_address = ins.PrivateIpAddress;
                info.launch_time = ins.LaunchTime;
                info.image_id = ins.ImageId;
                info.az = ins.Placement.AvailabilityZone;

                if (typeof ins.PublicIpAddress === 'undefined')
                {
                    info.public_ip_address = '';
                }
                else
                {
                    info.public_ip_address = ins.PublicIpAddress;
                }

                info.tags = {};
                info.name = '<unknown>';
                info.asg = '';
                for (var j = 0; j < ins.Tags.length; j++) {
                    if (ins.Tags[j].Key === 'Name')
                    {
                        info.name = ins.Tags[j].Value;
                        continue;
                    }
                    if (ins.Tags[j].Key === 'aws:autoscaling:groupName')
                    {
                        info.asg = ins.Tags[j].Value;
                        continue;
                    }

                    info.tags[ins.Tags[j].Key] = ins.Tags[j].Value;
                }

                info.security_groups = [];
                for (j = 0; j < ins.SecurityGroups.length; j++)
                {
                    var g = ins.SecurityGroups[j];
                    info.security_groups.push ({
                        'name': g.GroupName,
                        'id': g.GroupId
                    });
                }

                // console.debug ("info: ", JSON.stringify (info, null, 2));

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

            _instance_timestamp = Date.now ();

            var instance_cache = {
                timestamp: _instance_timestamp,
                instances: _instances
            };

            // console.debug ("[aws_info] storing instance cache: ", instance_cache);
            localStorage.setItem ('instance_cache', JSON.stringify (instance_cache));

            callback (_instances);
        });
    };

    return _self;
}