export default function LeaderboardSkeleton() {
  return (
    <div className="space-y-14">
      {/* Page Header - actual content, no loading */}
      <section className="text-center space-y-3 pt-2">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none flex items-center gap-4">
            Leaderboard
          </h1>
        </div>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
        <p className="text-[10px] font-black flex justify-center text-muted-foreground uppercase tracking-[0.2em] flex items-center text-center gap-2">
          Compare performance & portfolio metrics against the most successful users
        </p>
      </section>

      {/* Desktop Podium skeleton */}
      <section className="hidden lg:flex items-end mx-auto px-25 justify-center gap-5 pt-10">
        {[2, 1, 3].map((rank) => {
          const isFirst = rank === 1;
          const isSecond = rank === 2;
          const isThird = rank === 3;
          
          return (
            <div
              key={rank}
              className={[
                "relative flex flex-col cursor-pointer items-center text-center rounded-[1.5rem] p-3 border-2 transition-all duration-500",
                isFirst ? "flex-[1.15] w-44 -translate-y-4 border-yellow-500/40 bg-gradient-to-b from-yellow-500/[0.06] via-card to-card" : 
                isSecond ? "flex-1 w-40 translate-y-0 border-slate-400/30 bg-gradient-to-b from-slate-400/[0.04] via-card to-card" :
                "flex-1 w-40 translate-y-0 border-amber-700/30 bg-gradient-to-b from-amber-800/[0.05] via-card to-card",
                "border-border bg-card hover:-translate-y-1 hover:scale-[1.01]",
                isFirst ? "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-transparent before:via-yellow-400/60 before:to-transparent before:rounded-t-[1.5rem]" :
                isSecond ? "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-slate-400/40 before:to-transparent before:rounded-t-[1.5rem]" :
                "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-amber-600/40 before:to-transparent before:rounded-t-[1.5rem]"
              ].join(" ")}
            >
              {/* Rank badge */}
              <div className={[
                "absolute left-1/2 -translate-x-1/2 -top-5 z-10",
                isFirst ? "animate-bounce [animation-duration:3s]" : "",
              ].join(" ")}>
                <div className={[
                  "object-contain bg-muted/30 rounded animate-pulse",
                  isFirst ? "w-12 h-12" : "w-10 h-10",
                ].join(" ")} />
              </div>

              {/* Avatar */}
              <div className={[
                "rounded-[1rem] border-2 p-1 mt-8 bg-muted/30 animate-pulse",
                isFirst ? "w-20 h-20 border-yellow-500/50" : 
                isSecond ? "w-18 h-18 border-slate-400/40" :
                "w-18 h-18 border-amber-700/40"
              ].join(" ")} />

              {/* Username */}
              <p className={[
                "font-black uppercase tracking-wider mt-2 mb-3 px-1 text-foreground",
                isFirst ? "text-yellow-300 text-xl" : 
                isSecond ? "text-slate-300 text-lg" :
                "text-amber-400 text-lg"
              ].join(" ")}
              style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.08em" }}>
                Loading...
              </p>

              {/* Score panel */}
              <div className={[
                "w-full rounded-xl flex flex-col items-center py-2.5 px-4 border mt-auto relative overflow-hidden",
                isFirst ? "bg-yellow-500/8 border-yellow-500/20" : 
                isSecond ? "bg-slate-500/8 border-slate-400/15" :
                "bg-amber-800/8 border-amber-700/15"
              ].join(" ")}>
                <p className={[
                  "font-black tracking-tight text-green-400 relative z-10",
                  isFirst ? "text-4xl" : "text-3xl"
                ].join(" ")}
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Loading...
                </p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1 pt-1 border-t border-border/50 w-full text-center relative z-10">
                  Total Withdrawals
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Mobile Top 3 Slider skeleton */}
      <section className="relative lg:hidden pb-6 overflow-hidden">
        {/* Section label */}
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-muted-foreground/30 text-center mb-5">
          Top Players This Season
        </p>

        {/* Track outer with peek effect */}
        <div className="w-full overflow-hidden">
          <div 
            className="flex transition-transform duration-[420ms] ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform"
            style={{
              // 80% per slide, offset by 10% so first card centers
              transform: "translateX(calc(-1 * 80% + 10%))",
            }}
          >
            {[2, 1, 3].map((rank, i) => {
              const isActive = i === 1; // Center position (1st place) active by default
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;

              // Rank-specific styling
              const rankStyle = {
                1: {
                  card: "border-yellow-500/45 bg-gradient-to-b from-yellow-500/[0.08] via-card to-card",
                  topLine: "via-yellow-500/70",
                  avatarBorder: "border-yellow-500/55",
                  username: "text-yellow-300",
                  panel: "bg-yellow-500/[0.07] border-yellow-500/20",
                  score: "text-yellow-300",
                },
                2: {
                  card: "border-slate-400/30 bg-gradient-to-b from-slate-400/[0.05] via-card to-card",
                  topLine: "via-slate-400/45",
                  avatarBorder: "border-slate-400/40",
                  username: "text-slate-300",
                  panel: "bg-slate-400/[0.06] border-slate-400/15",
                  score: "text-slate-200",
                },
                3: {
                  card: "border-amber-700/30 bg-gradient-to-b from-amber-800/[0.06] via-card to-card",
                  topLine: "via-amber-600/45",
                  avatarBorder: "border-amber-700/40",
                  username: "text-amber-400",
                  panel: "bg-amber-800/[0.07] border-amber-700/16",
                  score: "text-amber-300",
                },
              }[rank as 1 | 2 | 3];

              return (
                <div
                  key={rank}
                  className="flex-[0_0_80%] px-1 transition-all duration-350"
                  style={{
                    opacity: isActive ? 1 : 0.45,
                    transform: isActive ? "scale(1)" : "scale(0.93)",
                  }}
                >
                  {/* Card */}
                  <div
                    className={[
                      "relative rounded-[1.25rem] border-[1.5px] overflow-hidden",
                      rankStyle.card,
                    ].join(" ")}
                  >
                    {/* Top accent line */}
                    <div
                      className={[
                        "absolute inset-x-0 top-0 h-[1.5px] rounded-t-[1.25rem]",
                        "bg-gradient-to-r from-transparent to-transparent",
                        rankStyle.topLine,
                      ].join(" ")}
                    />

                    <div className="flex flex-col items-center gap-0 px-5 pt-7 pb-6 text-center relative z-10">
                      {/* Rank badge */}
                      <div
                        className={[
                          "object-contain mb-3 bg-muted/30 rounded animate-pulse",
                          isFirst ? "w-14 h-14" : "w-11 h-11",
                          isFirst ? "animate-[float_3s_ease-in-out_infinite]" : "",
                        ].join(" ")}
                      />

                      {/* Avatar */}
                      <div
                        className={[
                          "rounded-[0.875rem] border-2 p-0.5 mb-4",
                          "w-16 h-16 bg-muted/30 animate-pulse",
                          rankStyle.avatarBorder,
                        ].join(" ")}
                      />

                      {/* Username */}
                      <p
                        className={["font-black uppercase tracking-[0.1em] mb-4", rankStyle.username].join(" ")}
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "1.1rem",
                        }}
                      >
                        Loading...
                      </p>

                      {/* Score panel */}
                      <div
                        className={[
                          "w-full rounded-xl border flex flex-col items-center py-3.5 px-5 gap-1.5",
                          rankStyle.panel,
                        ].join(" ")}
                      >
                        <p
                          className={["font-black leading-none", rankStyle.score].join(" ")}
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: "2rem",
                          }}
                        >
                          Loading...
                        </p>
                        <p className="text-[8px] font-black uppercase tracking-[0.22em] text-muted-foreground pt-1.5 border-t border-border w-full text-center">
                          Total Withdrawals
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls skeleton */}
        <div className="flex items-center justify-center gap-4 mt-5 px-5">
          {/* Prev arrow skeleton */}
          <div className="w-9 h-9 rounded-[0.625rem] border border-border bg-muted/20 animate-pulse" />
          
          {/* Dots - Rank colored with 2nd active (1st place) */}
          <div className="flex items-center gap-1.5">
            {[2, 1, 3].map((rank, i) => {
              const isActive = i === 1; // Center position (1st place) active
              const dotColor = {
                1: isActive ? "bg-yellow-400/85" : "bg-muted-foreground/25",
                2: isActive ? "bg-slate-400/75" : "bg-muted-foreground/25", 
                3: isActive ? "bg-amber-500/80" : "bg-muted-foreground/25",
              }[rank as 1 | 2 | 3];

              return (
                <div
                  key={rank}
                  className={[
                    "h-[5px] rounded-full transition-all duration-300 animate-pulse",
                    isActive ? "w-5" : "w-[5px]",
                    dotColor,
                  ].join(" ")}
                />
              );
            })}
          </div>
          
          {/* Next arrow skeleton */}
          <div className="w-9 h-9 rounded-[0.625rem] border border-border bg-muted/20 animate-pulse" />
        </div>
      </section>

      {/* Leaderboard Table skeleton */}
      <section className="bg-card border border-border rounded-[1rem] overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-6 md:p-5 border-b border-border flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted/30 rounded-2xl animate-pulse"></div>
            <div className="h-3 w-48 bg-muted/30 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-black uppercase tracking-tight">
            <thead>
              <tr className="border-b border-border/50">
                {["Rank", "Player", "Email", "Account Balance", "Total Withdrawals", "Total Profits", "Total Deposits"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {[...Array(10)].map((_, index) => (
                <tr key={index} className="group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-muted/30 rounded animate-pulse" />
                      <div className="h-5 w-8 bg-muted/30 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-muted/30 animate-pulse" />
                      <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-3 w-32 bg-muted/30 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <div className="w-3.5 h-3.5 bg-muted/30 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <div className="w-3.5 h-3.5 bg-muted/30 rounded animate-pulse" />
                      <div className="h-4 w-16 bg-muted/30 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <div className="w-3.5 h-3.5 bg-muted/30 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <div className="w-3.5 h-3.5 bg-muted/30 rounded animate-pulse" />
                      <div className="h-4 w-20 bg-muted/30 rounded animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
