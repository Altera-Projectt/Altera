# Backend

Designer marketplace commission can be configured with `DESIGNER_COMMISSION_RATE` as a fraction between `0` and `1` (for example, `0.10` means 10%). When it is unset or invalid, the designer summary returns gross sales but leaves platform fee and designer earnings unavailable rather than assuming a fee.
