const User = require("../../models/user");
const Event = require("../../models/event");
const Booking = require("../../models/booking");
const bcrypt = require("bcryptjs");

const { dateToString } = require("../../helpers/date");

const transformEvent = event => {
  return {
    ...event._doc,
    _id: event.id,
    date: dateToString(event._doc.date),
    creator: user.bind(this, event.creator)
  };
};

const transformBooking = booking => {
  return {
    ...booking._doc,
    _id: booking.id,
    createdAt: dateToString(booking._doc.createdAt),
    updatedAt: dateToString(booking._doc.updatedAt),
    event: singleEvent.bind(this, booking._doc.event), // using event id stored in booking
    user: user.bind(this, booking._doc.user) // using user id stored in booking
  };
};

const events = async eventIds => {
  try {
    const events = await Event.find({ _id: { $in: eventIds } });

    return events.map(event => {
      return transformEvent(event);
    });
  } catch (err) {
    throw err;
  }
};

const singleEvent = async eventId => {
  try {
    const singleEvent = await Event.findById(eventId);
    return transformEvent(singleEvent);
  } catch (err) {
    throw err;
  }
};

const user = async userId => {
  try {
    const user = await User.findById(userId);

    return {
      ...user._doc,
      _id: user.id,
      createdEvents: events.bind(this, user._doc.createdEvents)
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  events: async () => {
    //testing without mongodb
    // return events;
    try {
      const events = await Event.find();

      return events.map(event => {
        console.log(event);
        return transformEvent(event);
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  //book Event resolvers

  bookings: async () => {
    try {
      const bookings = await Booking.find();
      return bookings.map(booking => {
        return transformBooking(booking);
      });
    } catch (err) {
      throw err;
    }
  },

  // create event resolvers
  createEvent: async args => {
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: dateToString(args.eventInput.date),
      creator: "5d18a46fcf7e5c2d08f4860a"
    });
    let createdEvent;
    try {
      const result = await event.save();

      createdEvent = transformEvent(result);
      const creatorUser = await User.findById("5d18a46fcf7e5c2d08f4860a");
      console.log(result);
      //return { ...result._doc, _id: result._doc._id.toString() }; // replace the original id with the new string id

      if (!creatorUser) {
        throw new Error("yo dude, the dude man is on another planet");
      }
      creatorUser.createdEvents.push(event);
      await creatorUser.save();

      return createdEvent;
    } catch (err) {
      console.log(err);
      throw err;
    }

    //testing
    /*  const event = {
        _id: Math.random().toString(),
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: args.eventInput.date
      };
      console.log(event);
      events.push(event);
      return event; */
  },
  createUser: async args => {
    // check for existing user
    try {
      const existingUser = await User.findOne({ email: args.userInput.email });

      if (existingUser) {
        throw new Error("yo dude, the dude man already exist");
      }
      const hashedPassword = bcrypt.hash(args.userInput.password, 12);

      const user = new User({
        email: args.userInput.email,
        password: hashedPassword
      });
      const result = await user.save();

      return { ...result._doc, password: null, _id: result.id };
    } catch (err) {
      throw err;
    }
  },
  bookEvent: async args => {
    const fetchedEvent = await Event.findOne({ _id: args.eventId });
    const booking = new Booking({
      user: "5d18a46fcf7e5c2d08f4860a",
      event: fetchedEvent
    });

    const result = await booking.save();
    return transformBooking(result);
  },

  cancelBooking: async args => {
    try {
      const fectchBooking = await Booking.findById(args.bookingId).populate(
        "event"
      );
      const event = transformEvent(fectchBooking.event);
      await Booking.deleteOne({ _id: args.bookingId });
      return event;
    } catch (err) {
      throw err;
    }
  }
};
