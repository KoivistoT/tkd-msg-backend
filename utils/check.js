const addOrPullReaction = (reactions, reaction, currentUserId) => {
  let action = "$addToSet";
  if (reactions.length !== 0) {
    reactions.forEach((element) => {
      if (
        element.reactionByUser === currentUserId &&
        element.reaction === reaction
      ) {
        action = "$pull";
      }
    });
  }

  return action;
};

exports.check = { addOrPullReaction };
