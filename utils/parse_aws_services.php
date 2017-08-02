#!/usr/bin/php
<?php

$services = array ();

$g_codes = array (
    'cloudwatch_events_rules' => 1,
    'cloudwatch_logs' => 1,
    'cloudwatch_metrics' => 1,
    'dynamodb_tables' => 1,
    'ec2_amis' => 1,
    'ec2_auto_scaling_groups' => 1,
    'ec2_instances' => 1,
    'ec2_elb' => 1,
    'ec2_ebs' => 1,
    'ec2_security_groups' => 1,
    'elasticache_memcached' => 1,
    'elasticache_redis' => 1,
    'rds_clusters' => 1,
    'rds_instances' => 1,
    'route53_hosted_zones' => 1,
    'ses_domains' => 1,
);

$g_names = array (
    'cloudwatch_events_rules' => 'Cloudwatch / Events / Rules',
    'cloudwatch_logs' => 'Cloudwatch / Logs',
    'cloudwatch_metrics' => 'Cloudwatch / Metrics',
    'dynamodb_tables' => 'DynamoDB / Tables',
    'ec2_amis' => 'EC2 / AMIs',
    'ec2_auto_scaling_groups' => 'EC2 / Auto Scaling Groups',
    'ec2_instances' => 'EC2 / Instances',
    'ec2_elb' => 'EC2 / ELB',
    'ec2_ebs' => 'EC2 / EBS',
    'ec2_security_groups' => 'EC2 / Security Groups',
    'elasticache_memcached' => 'ElastiCache / Memcached',
    'elasticache_redis' => 'ElastiCache / Redis',
    'rds_clusters' => 'RDS / Clusters',
    'rds_instances' => 'RDS / Instances',
    'route53_hosted_zones' => 'Route 53 / Hosted Zones',
    'ses_domains' => 'SES / Domains',
);

$g_mgmt_urls = array (
    'cloudwatch_events_rules' => 'https://console.aws.amazon.com/cloudwatch/home#rules:',
    'cloudwatch_logs' => 'https://console.aws.amazon.com/cloudwatch/home#logs:',
    'cloudwatch_metrics' => 'https://console.aws.amazon.com/cloudwatch/home#metricsV2:',
    'dynamodb_tables' => 'https://console.aws.amazon.com/dynamodb/home#tables:',
    'ec2_amis' => 'https://console.aws.amazon.com/ec2/v2/home#Images:sort=desc:creationDate',
    'ec2_auto_scaling_groups' => 'https://console.aws.amazon.com/ec2/autoscaling/home#AutoScalingGroups:',
    'ec2_instances' => 'https://console.aws.amazon.com/ec2/v2/home#Instances:',
    'ec2_elb' => 'https://console.aws.amazon.com/ec2/v2/home#LoadBalancers:',
    'ec2_ebs' => 'https://console.aws.amazon.com/ec2/v2/home#Volumes:',
    'ec2_security_groups' => 'https://console.aws.amazon.com/ec2/v2/home#SecurityGroups:',
    'elasticache_memcached' => 'https://console.aws.amazon.com/elasticache/home#memcached:',
    'elasticache_redis' => 'https://console.aws.amazon.com/elasticache/home#redis:',
    'rds_clusters' => 'https://console.aws.amazon.com/rds/home#dbclusters:',
    'rds_instances' => 'https://console.aws.amazon.com/rds/home#dbinstances:',
    'route53_hosted_zones' => 'https://console.aws.amazon.com/route53/home?#hosted-zones:',
    'ses_domains' => 'https://console.aws.amazon.com/ses/home#verified-senders-domain:',
);

$g_pricing_urls = array (
);

$fp = fopen ("aws_services.html", "r");
while ($line = fgets ($fp))
{
    if (!preg_match_all ('#<a\s+href="(.+?)".+?>(.+?)</a>#', $line, $matches))
    {
        continue;
    }

    $urls = $matches[1];
    $names = $matches[2];

    $num_urls = count ($urls);
    for ($i = 0; $i < $num_urls; $i++)
    {
        $url = $urls[$i];
        $name = html_entity_decode (strip_tags ($names[$i]));

        $code = strtolower (trim ($name));
        $code = preg_replace ('#\s+#', '_', $code);

        $name = preg_replace ('#^Amazon\s+#', '', $name);
        $url = preg_replace ('#\?region=.+$#', '', $url);

        $g_codes[$code] = $code;
        $g_names[$code] = $name;
        $g_mgmt_urls[$code] = $url;
    }
}
fclose ($fp);

$fp = fopen ("aws_pricing.html", "r");
while ($line = fgets ($fp))
{
    if (!preg_match_all ('#<a.+?href="(.+?)".*?>(.+?)</a>#', $line, $matches))
    {
        continue;
    }

    $urls = $matches[1];
    $names = $matches[2];

    $num_urls = count ($urls);
    for ($i = 0; $i < $num_urls; $i++)
    {
        $url = $urls[$i];

        $name = trim (html_entity_decode (strip_tags ($names[$i])));
        $code = find_code ($name);

        $name = preg_replace ('#^(Amazon|AWS)\s+#', '', $name);

        /*
        if (!$code)
        {
            print "$code\n$name\n$url\n\n";
        }
        */

        $url = preg_replace ('#^/#', 'https://aws.amazon.com/', $url);

        $g_pricing_urls[$code] = $url;
    }
}
fclose ($fp);

function find_code ($name)
{
    global $g_codes;

    $code = strtolower (trim ($name));
    $code = preg_replace ('#\s+#', '_', $name);
    if (isset ($g_codes[$code]))
    {
        return $code;
    }

    $name = preg_replace ('#^(Amazon|AWS)\s+#', '', $name);

    $overrides = array (
        'Database Migration Service' => 'dms',
        'Directory Services' => 'directory_service',
        'Elastic Block Storage (EBS)' => 'ec2_ebs',
        'Elastic Compute Cloud (EC2) Container Service' => 'ec2_container_service',
        'Elastic Load Balancing' => 'ec2_elb',
        'Greengrass' => 'aws_greengrass',
        'IoT Platform' => 'aws_iot',
        'Simple Email Service' => 'ses',
        'WAF' => 'waf_&_shield',
    );

    if (isset ($overrides[$name]))
    {
        return $overrides[$name];
    }

    $code = strtolower (trim ($name));
    $code = preg_replace ('#\s+#', '_', $code);
    if (isset ($g_codes[$code]))
    {
        return $code;
    }

    if (preg_match ('#\((.+?)\)#', $name, $matches))
    {
        $code = strtolower (trim ($matches[1]));
        $code = preg_replace ('#\s+#', '_', $code);

        if (isset ($g_codes[$code]))
        {
            return $code;
        }
    }
}

$codes = array_keys ($g_codes);

usort ($codes, function ($a, $b) { global $g_names; return strcmp ($g_names[$a], $g_names[$b]); });

$output = array ();
foreach ($codes as $code)
{
    $pricing_url = '';
    if (isset ($g_pricing_urls[$code])) {
        $pricing_url = $g_pricing_urls[$code];
    }

    $output[] = array (
        $code,
        $g_names[$code],
        $g_mgmt_urls[$code],
        $pricing_url
    );
}

print json_encode ($output, JSON_PRETTY_PRINT);
