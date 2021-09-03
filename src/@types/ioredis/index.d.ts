export {};

declare global {
  namespace IORedis {
    interface Redis {
      call: () => any;
    }
  }
}
