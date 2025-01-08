// i.e., it must match "${{alphanumeric+underscore}}"
export const variableRegex = new RegExp(/\${{([a-zA-Z0-9_]+)}}/g);
