// Kiebitz - Privacy-Friendly Appointments
// Copyright (C) 2021-2021 The Kiebitz Authors
// README.md contains license information.

import dayjsOrig from "dayjs";
import utc from "dayjs/plugin/utc";

dayjsOrig.extend(utc);

export const dayjs = dayjsOrig;
