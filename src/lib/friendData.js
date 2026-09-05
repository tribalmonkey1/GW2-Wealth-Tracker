/**
 * Friend Recipe Lookup helpers — building lookup maps from the backend's
 * per-friend known-recipe / discipline-level responses, and the badge
 * copy shown on cards a friend can craft.
 * (Split out of App.jsx.)
 */

export function buildFriendRecipeMap(entries) {
  const map = {};
  for (const { friend_id, friend_name, recipe_ids } of (entries || [])) {
    for (const rid of recipe_ids) {
      if (!map[rid]) map[rid] = [];
      map[rid].push({ friendId: friend_id, friendName: friend_name });
    }
  }
  return map;
}

export function buildFriendDisciplineMap(entries) {
  const map = {};
  for (const { friend_id, discipline_levels } of (entries || [])) {
    map[friend_id] = discipline_levels || {};
  }
  return map;
}

export function friendBadgeInfo(b, ci) {
  if (b.viaDiscipline) {
    return {
      icon: "⚙",
      title: `${b.friendName}'s crafting discipline rating is high enough to make this themselves — even if it's not in their own formally known/discovered recipe list.`,
    };
  }
  if (ci.isFriendOnly) {
    return { icon: "🛠", title: `${b.friendName} knows this recipe — you don't. Materials shown are yours.` };
  }
  return {
    icon: "🛠",
    title: `${b.friendName} has genuinely discovered this recipe. You're shown as able to craft it because your discipline rating qualifies, but you haven't actually discovered it yourself yet.`,
  };
}
