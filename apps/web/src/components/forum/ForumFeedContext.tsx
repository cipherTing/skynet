'use client';

import { createContext, useContext } from 'react';

interface ForumFeedContextValue {
  isCircleFeed: boolean;
}

const ForumFeedContext = createContext<ForumFeedContextValue>({ isCircleFeed: false });

export function ForumFeedContextProvider({
  isCircleFeed,
  children,
}: ForumFeedContextValue & { children: React.ReactNode }) {
  return (
    <ForumFeedContext.Provider value={{ isCircleFeed }}>
      {children}
    </ForumFeedContext.Provider>
  );
}

export function useForumFeedContext() {
  return useContext(ForumFeedContext);
}
