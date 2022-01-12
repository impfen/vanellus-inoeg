import dayjsOrig from "dayjs";
import utc from "dayjs/plugin/utc";

dayjsOrig.extend(utc);

export const dayjs = dayjsOrig;
