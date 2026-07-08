const InPlaying = () => (
  <div className="flex h-3 w-3 items-end justify-center gap-0.5">
    <div
      className="w-0.5 animate-[music-bar_0.6s_ease-in-out_infinite] rounded-full bg-zinc-400"
      style={{ height: "60%" }}
    />
    <div
      className="w-0.5 animate-[music-bar_0.8s_ease-in-out_infinite_0.1s] rounded-full bg-zinc-400"
      style={{ height: "100%" }}
    />
    <div
      className="w-0.5 animate-[music-bar_0.5s_ease-in-out_infinite_0.2s] rounded-full bg-zinc-400"
      style={{ height: "40%" }}
    />
  </div>
);

export default InPlaying;
