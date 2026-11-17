# Stop dev/e2e servers still running from this workspace, then delete everything `npm run setup` created
# (plus .next): archived workspaces stay on disk (restorable) and node_modules alone is ~1.8G.
for pid in $(lsof -nP -iTCP -sTCP:LISTEN -t | sort -u); do
  cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
  case "$cwd" in
    "$PWD" | "$PWD"/*) kill "$pid" 2>/dev/null && echo "stopped pid $pid ($cwd)" ;;
  esac
done
rm -rf node_modules .husky/_ .vercel .env.local sanity.types.ts sanity/extract.json .next
exit 0
