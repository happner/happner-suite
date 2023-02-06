module.exports = class SecurityProfilesConfigurator {
  static configure(config, utils) {
    if (!config.profiles) config.profiles = [];

    config.profiles.push({
      name: 'default-browser', // this is the default underlying profile for stateful sessions
      session: {
        'info._browser': {
          $eq: true,
        },
      },
      policy: {
        ttl: '7 days', //a week
        inactivity_threshold: '1 hour',
      },
    });

    config.profiles.push({
      name: 'default-stateful', // this is the default underlying profile for stateful sessions
      session: {
        type: {
          $eq: 1,
        },
      },
      policy: {
        ttl: 0, //session never goes stale
        inactivity_threshold: Infinity,
      },
    });

    config.profiles.push({
      name: 'default-stateless', // this is the default underlying profile for stateless sessions (REST)
      session: {
        type: {
          $eq: 0,
        },
      },
      policy: {
        ttl: 0, //session never goes stale
        inactivity_threshold: Infinity,
      },
    });

    config.profiles.forEach((profile) => {
      if (profile.policy.ttl && profile.policy.ttl !== Infinity)
        profile.policy.ttl = utils.toMilliseconds(profile.policy.ttl);
      if (profile.policy.inactivity_threshold && profile.policy.ttl !== Infinity)
        profile.policy.inactivity_threshold = utils.toMilliseconds(
          profile.policy.inactivity_threshold
        );
    });

    return config;
  }
};
