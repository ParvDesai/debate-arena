import { create } from 'zustand'

const useRoomStore = create((set) => ({
  room: null,
  arguments: [],
  forVotes: 0,
  againstVotes: 0,
  spectatorCount: 0,

  setRoom: (room) =>
    set((state) => ({
      room: typeof room === 'function' ? room(state.room) : room,
    })),

  addArgument: (arg) =>
    set((state) => ({
      arguments: [...state.arguments, arg],
    })),

  setArguments: (args) => set({ arguments: args }),

  updateVotes: ({ forVotes, againstVotes }) =>
    set({ forVotes, againstVotes }),

  setSpectatorCount: (count) => set({ spectatorCount: count }),

  reset: () =>
    set({
      room: null,
      arguments: [],
      forVotes: 0,
      againstVotes: 0,
      spectatorCount: 0,
    }),
}))

export default useRoomStore
