export const extractParentAndLabel = (fullSubname: string) => {
    const split = fullSubname.split(".");
    if (split.length === 3) {
      return {
        label: split[0],
        parent: split[1] + "." + split[2],
      };
    } else if (split.length === 2) {
      return {
        label: split[0],
        parent: split[1] + ".eth",
      };
    } else {
      throw Error(
        `Invalid subname ${fullSubname}, expected [label].[parent].[tld]`
      );
    }
  };
  