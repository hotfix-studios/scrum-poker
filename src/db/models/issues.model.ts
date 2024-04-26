import { Schema, model } from "mongoose";
import { DocumentTypes } from '../../types/index.js';

const issuesSchema = new Schema<DocumentTypes.Issue>({                       // ** REST OBJ. **
  _id: { type: Schema.Types.Number, required: true },               // .id
  url: { type: Schema.Types.String },
  repository_name: { type: Schema.Types.String },                   // from repository.name
  repository_url: { type: Schema.Types.String, ref: "Repository" }, // TODO: IS THIS RELATIONSHIP EXISTING??
  number: { type: Schema.Types.Number, required: true },            // sort by this field
  title: { type: Schema.Types.String, required: true },
  labels: [ { type: Schema.Types.String } ],
  state: { type: Schema.Types.String, required: true },             // * IF != "open" DON'T FETCH * (can only be "open" or "closed")
  body: { type: Schema.Types.String },
  pointed: { type: Schema.Types.Boolean, required: true, default: false },
});

// TODO: parsing repository_url for the repo name where needed will save a round trip repository name lookup...

// TODO: field `comments_url: { type: Schema.Types.String }` if want to assign url for fetch comments on issue

// TODO: this middleware may need to be detached from schema because Pointed may want to use findOneAndDelete w/o new write op
issuesSchema.post("findOneAndDelete", async (doc, next) => {
  if (doc) {
    try {
      await Pointed.create( { ...doc, pointed: true } );
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

/**
 * @abstract Issues pre-pointing
 * @implements issuesSchema
 */
export const Backlog = model("Backlog", issuesSchema);

/**
 * @abstract Issues post-pointing
 * @implements issuesSchema
 */
export const Pointed = model<DocumentTypes.Issue>("Pointed", issuesSchema);
