export const getCompetitionClassFromType = (competitionType?: string | null): string | null => {
  switch (competitionType) {
    case "isEclectic":
      return "ECLECTIC";

    case "isEclectic-IS":
      return "CHALLENGE_HIVER";

    case "isRingerScore":
      return "RINGER_SCORE";

    case "isNotEclectic":
      return "STANDARD";

    default:
      return null;
  }
};

export const getCompetitionClassForRequest = (competitionType?: string | null): string | null => {
  if (competitionType === "covoiturage") {
    return "allTypes";
  }

  return getCompetitionClassFromType(competitionType);
};