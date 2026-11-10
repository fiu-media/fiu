import { type Team, TeamPhoto } from "@/content/siteSettings";
import { cn } from "@/lib/cn";

/** The team photo plus whether it is still the code's stand-in. The live pages never carry the flag; only these sign-off pages do. */
export type DevTeam = Team & { placeholder?: boolean };

/** `TeamPhoto`, with a "Placeholder" badge on a stand-in photo. The caller sets the shape, as with `TeamPhoto`. */
export function PlaceholderTeamPhoto({ team, sizes, className }: { team: DevTeam; sizes: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <TeamPhoto team={team} sizes={sizes} className="size-full" />
      {team.placeholder && (
        <span className="absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium tracking-[0.1em] text-white uppercase">
          Placeholder
        </span>
      )}
    </div>
  );
}
