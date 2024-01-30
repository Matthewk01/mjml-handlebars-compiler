import fs from "fs";
import handlebars from "handlebars";
import mjml2html from "mjml";
import { parse, resolve } from "path";

const INPUT_DIR = "templates";
const OUTPUT_DIR = "out";

const getUniqueTemplatePathsWithoutExtensions = () => {
  const templates = fs.readdirSync(INPUT_DIR);
  const templatesFiles = templates
    .filter((template) => template.includes(".mjml"))
    .map((template) => template.split(".")[0]);
  return templatesFiles.map((template) => resolve(`${INPUT_DIR}/${template}`));
};

const compileHandlebars = async (templatePaths: string[]) => {
  const mjmlWithoutHendlebars: string[][] = [];
  for (const templatePath of templatePaths) {
    const templateMjmlPath = `${templatePath}.mjml`;
    const templateBlob = fs.readFileSync(templateMjmlPath, "utf8");
    const { default: templateData } = await import(`${templatePath}.json`, {
      assert: {
        type: "json",
      },
    });
    const { dir } = parse(templateMjmlPath);

    handlebars.registerHelper("include", (partial: string, finalProps: any) => {
      const partialPath = resolve(dir, `${partial}.mjml`);
      const partialBlob = fs.readFileSync(partialPath, "utf8");
      const partialCompiled = handlebars.compile(partialBlob)(finalProps);
      return new handlebars.SafeString(partialCompiled);
    });
    handlebars.registerHelper("length", function (array: any) {
      return array.length;
    });
    handlebars.registerHelper(
      "greaterThan",
      function (a: any, b: any, options: any) {
        if (a > b) {
          // @ts-ignore
          return options.fn(this);
        } else {
          // @ts-ignore
          return options.inverse(this);
        }
      },
    );
    handlebars.registerHelper(
      "equals",
      function (a: any, b: any, options: any) {
        if (a === b) {
          // @ts-ignore
          return options.fn(this);
        } else {
          // @ts-ignore
          return options.inverse(this);
        }
      },
    );

    const templateCompiled = handlebars.compile(templateBlob)(templateData);
    mjmlWithoutHendlebars.push([templatePath, templateCompiled]);
    handlebars.unregisterHelper("include");
  }
  return mjmlWithoutHendlebars;
};

const main = () => {
  const templates = getUniqueTemplatePathsWithoutExtensions();
  compileHandlebars(templates).then((mjmlBlobs) => {
    mjmlBlobs.forEach((mjmlBlob, index) => {
      const [templatePath, templateCompiled] = mjmlBlob;
      const { html } = mjml2html(templateCompiled);
      const fileName = templatePath.split("/").pop();
      fs.writeFileSync(`${OUTPUT_DIR}/${fileName}.html`, html, "utf8");
    });
  });
};

main();
