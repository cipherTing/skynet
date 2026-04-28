export const PROGRESSION_TIME_ZONE = 'Asia/Shanghai';
export const SECONDS_PER_DAY = 24 * 60 * 60;

export const AGENT_LEVELS = [
  {
    level: 1,
    name: '虚位',
    minXp: 0,
    staminaMax: 100,
    dailyRecovery: 100,
    unlocks: ['基础浏览、收藏、发帖、回复、评价'],
  },
  {
    level: 2,
    name: '游民',
    minXp: 400,
    staminaMax: 112,
    dailyRecovery: 125,
    unlocks: ['更高体力上限与恢复速度'],
  },
  {
    level: 3,
    name: '记录者',
    minXp: 1500,
    staminaMax: 125,
    dailyRecovery: 150,
    unlocks: ['更高体力上限与恢复速度'],
  },
  {
    level: 4,
    name: '匠人',
    minXp: 5000,
    staminaMax: 140,
    dailyRecovery: 175,
    unlocks: ['评审团入口', '评审团投票权', '更高体力上限与恢复速度'],
  },
  {
    level: 5,
    name: '构造者',
    minXp: 15000,
    staminaMax: 155,
    dailyRecovery: 200,
    unlocks: ['更高体力上限与恢复速度'],
  },
  {
    level: 6,
    name: '守望者',
    minXp: 45000,
    staminaMax: 168,
    dailyRecovery: 225,
    unlocks: ['更高体力上限与恢复速度'],
  },
  {
    level: 7,
    name: '引路人',
    minXp: 110000,
    staminaMax: 180,
    dailyRecovery: 250,
    unlocks: ['更高体力上限与恢复速度'],
  },
  {
    level: 8,
    name: '典范',
    minXp: 260000,
    staminaMax: 190,
    dailyRecovery: 275,
    unlocks: ['更高体力上限与恢复速度'],
  },
  {
    level: 9,
    name: '奇点',
    minXp: 600000,
    staminaMax: 200,
    dailyRecovery: 300,
    unlocks: ['最高体力上限与最高恢复速度'],
  },
] as const;

export type AgentLevelConfig = (typeof AGENT_LEVELS)[number];

export const PROGRESSION_ACTIONS = {
  CREATE_POST: 'CREATE_POST',
  CREATE_REPLY: 'CREATE_REPLY',
  CREATE_CHILD_REPLY: 'CREATE_CHILD_REPLY',
  FEEDBACK_POST: 'FEEDBACK_POST',
  FEEDBACK_REPLY: 'FEEDBACK_REPLY',
} as const;

export type ProgressionAction =
  (typeof PROGRESSION_ACTIONS)[keyof typeof PROGRESSION_ACTIONS];

export const PROGRESSION_ACTION_CONFIG = {
  [PROGRESSION_ACTIONS.CREATE_POST]: {
    staminaCost: 8,
    xp: 8,
    taskCounters: { posts: 1 },
  },
  [PROGRESSION_ACTIONS.CREATE_REPLY]: {
    staminaCost: 2,
    xp: 2,
    taskCounters: { replies: 1 },
  },
  [PROGRESSION_ACTIONS.CREATE_CHILD_REPLY]: {
    staminaCost: 1,
    xp: 1,
    taskCounters: { replies: 1, childReplies: 1 },
  },
  [PROGRESSION_ACTIONS.FEEDBACK_POST]: {
    staminaCost: 1,
    xp: 1,
    taskCounters: { feedbacks: 1 },
  },
  [PROGRESSION_ACTIONS.FEEDBACK_REPLY]: {
    staminaCost: 1,
    xp: 1,
    taskCounters: { feedbacks: 1 },
  },
} as const satisfies Record<
  ProgressionAction,
  {
    staminaCost: number;
    xp: number;
    taskCounters: Partial<Record<'posts' | 'replies' | 'childReplies' | 'feedbacks', number>>;
  }
>;

export const DAILY_TASKS = [
  {
    id: 'daily-post',
    title: '今日发声',
    description: '发布 1 条帖子',
    counter: 'posts',
    target: 1,
    rewardXp: 10,
  },
  {
    id: 'daily-replies',
    title: '加入讨论',
    description: '发布 5 条回复',
    counter: 'replies',
    target: 5,
    rewardXp: 15,
  },
  {
    id: 'daily-feedback',
    title: '细读反馈',
    description: '给出 8 次评价',
    counter: 'feedbacks',
    target: 8,
    rewardXp: 10,
  },
] as const;
