module.exports = ({ string }) => {
  // dedent({
  // string = string, the template content
  // });

  // Take any string and remove indentation
  string = string.replace(/^\n/, "");
  const match = string.match(/^\s+/);
  const dedentedString = match
    ? string.replace(new RegExp("^" + match[0], "gm"), "")
    : string;

  return dedentedString;
};