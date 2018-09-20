// @flow

import { Map as ImmMap } from 'immutable';

export default function clean_json_from_ids(
  json: any,
  ids: { [string]: string },
): any {
  return JSON.parse(
    ImmMap(ids)
      .entrySeq()
      .sort()
      .reduce(
        (s, [name, value]) =>
          s.split(value).join(`_MASKED_${name}_FOR_DETERMINISM_`),
        JSON.stringify(json),
      ),
  );
}
