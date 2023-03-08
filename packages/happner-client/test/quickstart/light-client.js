let start = async () => {
  const LightClient = require('happner-client').Light;
  const Happner = require('happner-2');
  const DOMAIN = 'DOMAIN_NAME';

  const serverInstance = await Happner.create({
    domain: DOMAIN,
    happn: {
      secure: true,
      adminPassword: 'xxx',
    },
    modules: {
      remoteComponent: {
        instance: {
          remoteMethod: async (arg1, arg2, $happn) => {
            $happn.emit(`remoteEvents/1`, { arg1, arg2 });
            return `${arg1}/${arg2}`;
          },
        },
      },
    },
    components: {
      remoteComponent: {},
    },
  });

  const connectionOptions = {
    host: 'localhost',
    port: 55000,
    username: '_ADMIN',
    domain: DOMAIN, // the domain of the cluster or the name of the happner mesh you are connecting to
  };

  const myClient = await LightClient.create({ ...connectionOptions, password: 'xxx' });

  // call a remote method like so, will throw a not implemented error if the remote component or method does not exist:
  const result = await myClient.exchange.$call({
    component: 'remoteComponent',
    method: 'remoteMethod',
    arguments: ['arg1', 'arg2'],
  });

  // eslint-disable-next-line no-console
  console.log(result);

  // listen for an event every time it happens
  const onEventId = await myClient.event.$on(
    { component: 'remoteComponent', path: 'remoteEvents/*' },
    function (eventData) {
      // our handler does something with the event data
      // eslint-disable-next-line no-console
      console.log('$on:' + JSON.stringify(eventData));
    }
  );

  // unlisten by event handle
  await myClient.event.$off(onEventId);

  // or unlisten by component and path
  await myClient.event.$offPath({ component: 'remoteComponent', path: 'remoteEvents/*' });

  // listen for an event once only, does equivalent of $off after the event is handled
  await myClient.event.$once(
    { component: 'remoteComponent', path: 'remoteEvents/*' },
    function (eventData) {
      // our handler does something with the event data
      // eslint-disable-next-line no-console
      console.log('$once:' + JSON.stringify(eventData));
    }
  );

  // call again for our once to kick in
  await myClient.exchange.$call({
    component: 'remoteComponent',
    method: 'remoteMethod',
    arguments: ['arg1', 'arg2'],
  });

  // call yet again - ensure once only fired once
  await myClient.exchange.$call({
    component: 'remoteComponent',
    method: 'remoteMethod',
    arguments: ['arg1', 'arg2'],
  });

  // grab our session token
  let token = myClient.dataClient().session.token;
  // create a new session off the token
  let myOtherClient = await LightClient.create({ ...connectionOptions, token });
  // eslint-disable-next-line no-console
  console.log(`status === 1: ${myOtherClient.dataClient().status === 1}`);

  // parent client logout
  await myClient.logout();
  // possible need for delay...then:
  // eslint-disable-next-line no-console
  console.log(`status === 2: ${myOtherClient.dataClient().status === 2}`); // child myOtherClient disconnected, as it was authenticated via parent myClient's token
  serverInstance.stop();
};
start();
