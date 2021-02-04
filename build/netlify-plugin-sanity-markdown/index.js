module.exports = {
  onPreBuild: async ({
    inputs: {
      projectID,
      dataset = "production",
      contentDir
    },
    utils
  }) => {
    console.log("Starting plugin");
    //imports
    const fs = require("fs-extra");
    const toMarkdown = require("@sanity/block-content-to-markdown");
    const client = require("@sanity/client")({
      projectId: projectID,
      dataset,
      useCdn: false,
    });

    //add any serializers for your portable text
    const serializers = {
      types: {
        code: (props) =>
          "```" + props.node.language + "\n" + props.node.code + "\n```",
      },
    };
    if(false) {
      fs.readdir(`./${contentDir}`, (err, files) => {
        if (err) console.log(err);
        else {
          files.forEach((file) => {
            console.log(`Deleting: ${file}`);
            fs.unlink(`${contentDir}//${file}`, (err) => {
              if (err) throw err;

            });
          });
        }
      });
    }
    try {
      await client
        .fetch(`*[_type in ["movie","post"]]{categories[]->{title}, _type, _id, date, slug, title, imdb, body}`)
        .then((res) =>
          res.map(async (post) => {
            //output YAML frontmatter here
            let frontmatter = "---";
            frontmatter += `\nremote_service: sanity`
            frontmatter +=`\nremote_id: ${post._id}`
            Object.keys(post).forEach((field) => {
              if (field === "slug") {
                return (frontmatter += `\n${field}: "${post.slug.current}"`);
              } else if (field === "categories") {
                return (frontmatter += `\n${field}: [${post.categories.map(
                  (cat) => `"${cat.title}"`
                )}]`);
              } else if (field === "body") {
                return;
              } else {
                frontmatter += `\n${field}: "${post[field]}"`;
              }
            });
            frontmatter += "\n---\n\n";

            const wholePost = `${frontmatter}${toMarkdown(post.body, {
              serializers,
            })}`;

            const filePath = `./${contentDir}/${post._type}/${post.slug.current}.md`;
            fs.outputFile(filePath, wholePost, function (err, data) {
              if (err) {
                return console.log(err);
              }
            });
          })
        );
    } catch (error) {
      utils.build.failBuild("Failure message", { error });
    }
  },
};