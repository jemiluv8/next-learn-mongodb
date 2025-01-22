export interface LookupConfig {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
}

export function makeOneLookup(lookup: LookupConfig) {
  return [
    {
        $lookup: {
            from: lookup.from,
            localField: lookup.localField,
            foreignField: lookup.foreignField,
            as: lookup.as,
        },
    },
    {
        $unwind: {
            path: `$${lookup.as}`,
            preserveNullAndEmptyArrays: true,
        }
    },
  ];
}