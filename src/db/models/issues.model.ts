import { Schema, model } from "mongoose";

const issuesSchema = new Schema({                       // ** REST OBJ. **
  _id: { type: Schema.Types.Number, required: true },               // .id
  url: { type: Schema.Types.String },
  repository_url: { type: Schema.Types.String, ref: "Repository" }, // TODO: IS THIS RELATIONSHIP EXISTING??
  // repository_name: { type: Schema.Types.String },                // from repository.name??
  number: { type: Schema.Types.Number, required: true },            // sort by this field
  title: { type: Schema.Types.String, required: true },
  owner_name: { type: Schema.Types.String },                        // .user.login ** THESE ARE ISSUE OWNER**
  owner_id: { type: Schema.Types.Number, ref: "User" },             // .user.id    ** NOT ASSOCIATED REPO  **
  owner_avatar: { type: Schema.Types.String },                      // .user.avatar_url
  labels: [ { type: Schema.Types.String } ],
  state: { type: Schema.Types.String, required: true },             // * IF != "open" DON'T FETCH * (can only be "open" or "closed")
  body: { type: Schema.Types.String, required: true },
  pointed: { type: Schema.Types.Boolean, required: true, default: false },
});

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
export const Pointed = model("Pointed", issuesSchema);
