import React from "react";

const utils = {
  formatCurrency: (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(amount);
  },
  get_primary_color: (data) => {
    return data.business?.primary_color || "#000000";
  },
  get_secondary_color: (data) => {
    return data.business?.secundary_color || "#ffffff";
  },
};
export default utils;