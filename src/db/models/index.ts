import User from "./user.model.js";
import Room from "./room.model.js";
import Installation from "./installation.model.js";
import Repository from "./repository.model.js";
import { Backlog, Pointed } from "./issues.model.js";


/** ***************** **
 * ******************* *
 *  Export Models Hub  *
 * ******************* *
 ** ***************** **/

export {
  User,
  Room,
  Installation,
  Repository,
  Backlog,
  Pointed
};

/* Mongo Change Streams Implementation:
async function run() {
  // Create a new mongoose model
  const personSchema = new mongoose.Schema({
    name: String
  });
  const Person = mongoose.model('Person', personSchema);

  // Create a change stream. The 'change' event gets emitted when there's a
  // change in the database
  Person.watch().
    on('change', data => console.log(new Date(), data));

  // Insert a doc, will trigger the change stream handler above
  console.log(new Date(), 'Inserting doc');
  await Person.create({ name: 'Axl Rose' });
}
[Docs Example](https://thecodebarbarian.com/a-nodejs-perspective-on-mongodb-36-change-streams.html#change-streams-in-mongoose)
*/
