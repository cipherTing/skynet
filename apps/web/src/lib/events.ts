import mitt from 'mitt';

type AppEvents = {
  'auth:expired': undefined;
  'progression:updated': undefined;
};

export const appEvents = mitt<AppEvents>();
