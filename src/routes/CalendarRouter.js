const express = require("express");
const router = express.Router();
const pool = require("../database/connection"); // Import the database connection
const uniqid = require("uniqid");
const authMiddleware = require("../middlewares/auth");
const {
  dateConversion,
  convertObjectToProcedureParams,
} = require("../utils/common-functions");
const moment = require("moment");

//CalendarData
router.get("/calendar/get-calendar-data/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const [getActiveEventsRes] = await pool.execute("CALL getActiveEvents(?)", [
      user_id,
    ]);

    const getActiveEventsResults = getActiveEventsRes[0];

    const [getDraggableEventsRes] = await pool.execute(
      "CALL getDraggableEvents(?)",
      [user_id]
    );

    const getDraggableEventsResults = getDraggableEventsRes[0];

    const [time_12hrsRes] = await pool.execute("CALL gettime_12hrs()");

    const time_12hrsResults = time_12hrsRes[0];

    res.status(200).json({
      events: getActiveEventsResults,
      draggable_events: getDraggableEventsResults,
      time_12hrs: time_12hrsResults,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get_calendar_events
router.get("/calendar/get-calendar-events", async (req, res) => {
  try {
    const { user_id, month_year } = req.body;

    const get_month_year = [month_year];
    const monthYearString = JSON.stringify(get_month_year);

    const [getCalendarMonthEventsRes] = await pool.execute(
      "CALL getCalendarMonthEvents(?, ?)",
      [user_id, monthYearString]
    );

    const getCalendarMonthEventsResults = getCalendarMonthEventsRes[0];

    const promisesCalendarMonthEvents = getCalendarMonthEventsResults.map(
      async (item) => {
        const { id } = item;
        try {
          const [tasks] = await pool.execute("CALL getEventTodo(?,?)", [
            user_id,
            id,
          ]);
          const TODOs = tasks[0];
          const task_count = tasks[0].length;

          const [comp_tasks] = await pool.execute(
            "CALL getCompleteEventTodoCount(?,?)",
            [user_id, id]
          );

          const comp_tasks_count = comp_tasks[0][0]?.complete_count;
          let todo_percent = 0;
          todo_percent = Math.round((comp_tasks_count / task_count) * 100);

          if (todo_percent == null || isNaN(todo_percent)) {
            todo_percent = 0;
          }

          const data = {
            ...item,
            TODOs,
            todo_percent,
          };

          return data;
        } catch (error) {
          return {
            ...item,
            TODOs: [],
            todo_percent: 0,
          };
        }
      }
    );

    const promisesCalendarMonthEventsResults = await Promise.all(
      promisesCalendarMonthEvents
    );

    res.status(200).json({
      CalendarMonthEvents: promisesCalendarMonthEventsResults,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function displayDates(date1, date2, format = "YYYY-MM") {
  const dates = [];
  date1 = moment(date1).startOf("month");
  date2 = moment(date2).startOf("month");
  let current = date1.clone();

  while (current.isSameOrBefore(date2)) {
    dates.push(current.format(format));
    current.add(1, "month");
  }

  return dates;
}

//InsertCalendarData
router.post("/calendar/insert-calendar-data", async (req, res) => {
  try {
    const {
      user_id,
      draggable_event,
      event_repeat_option,
      created_type,
      portfolio_id,
      mfile,
      event_allDay,
      event_reminder_new,
      event_reminder,
      event_start_date,
      event_end_date,
      event_start_time,
      event_end_time,
      event_name,
      event_color,
      event_note,
      task_priority,
      meeting_link,
      meeting_location,
      meeting_agenda,
      custom_check,
    } = req.body;

    let GetInsertedId = [];
    const formattedDate = dateConversion();
    const unique_key = uniqid();
    const type = "event";
    const drag_id = "no_drag_id";
    let set_draggable_event = "";
    let set_event_reminder;
    let mfile_upload;
    let set_event_start_time;
    let set_event_end_time;

    if (
      event_repeat_option == "Daily" ||
      event_repeat_option == "Does not repeat"
    ) {
      if (created_type == "meeting") {
        set_draggable_event = "";
      } else if (created_type == "event" && portfolio_id !== "") {
        set_draggable_event = "";
      } else {
        set_draggable_event = draggable_event;
      }
    }

    if (event_allDay == "true") {
      set_event_reminder = event_reminder_new;
      set_event_start_time = "00:00:00";
      set_event_end_time = "00:00:00";
    } else {
      set_event_reminder = event_reminder;
      set_event_start_time = event_start_time;
      set_event_end_time = event_end_time;
    }

    if (created_type == "meeting" || created_type == "event") {
      mfile_upload = mfile.join(",");
    }

    if (
      event_repeat_option == "Does not repeat" ||
      event_repeat_option == "Daily"
    ) {
      const dateArray = displayDates(event_start_date, event_end_date);
      const set_date_array = JSON.stringify(dateArray);

      const InputFields = {
        student_id: user_id,
        event_name: event_name,
        event_color: event_color,
        event_note: event_note,
        event_start_date: event_start_date,
        event_end_date: event_end_date,
        date_array: set_date_array,
        end_date: event_end_date,
        event_start_time: set_event_start_time,
        event_end_time: set_event_end_time,
        unique_key: unique_key,
        event_repeat_option: "Does not repeat",
        event_allDay: event_allDay,
        event_reminder: set_event_reminder,
        draggable_event: set_draggable_event,
        draggable_id: drag_id,
        type: type,
        status: "active",
        event_repeat_option_type: event_repeat_option,
        date: formattedDate,
        created_type: created_type,
        task_priority: task_priority,
        event_reminder_send: "",
        in_app_reminder: "",
        meeting_link: meeting_link,
        meeting_location: meeting_location,
        meeting_agenda: meeting_agenda,
        portfolio_id: portfolio_id,
        mfile: mfile_upload,
      };
      const paramNamesString = Object.keys(InputFields).join(", ");
      const paramValuesString = Object.values(InputFields)
        .map((value) => `'${value}'`)
        .join(", ");

      await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
        paramNamesString,
        paramValuesString,
      ]);

      const [insertedIdResult] = await pool.execute(
        "SELECT @inserted_id_result AS inserted_id"
      );

      GetInsertedId.push(insertedIdResult[0].inserted_id);
    }

    if (event_repeat_option == "Every Weekday") {
      const start = event_start_date;
      const end = event_end_date;
      const format = "YYYY-MM-DD";

      const array = [];
      const interval = moment.duration(1, "day");
      const realEnd = moment(end).startOf("day");
      let current = moment(start).startOf("day");

      while (current.isSameOrBefore(realEnd)) {
        const day = current.format("ddd");

        if (day !== "Sat" && day !== "Sun") {
          array.push([current.format(format), day]);
        }

        current.add(1, "day");
      }

      const final = [];
      let array_key = 0;

      array.forEach((wd) => {
        if (!final[array_key]) {
          final[array_key] = [];
        }

        final[array_key].push(wd[0]);

        if (wd[1] === "Fri") {
          array_key++;
        }
      });

      for (const d of final) {
        const da = displayDates(d[0], d[d.length - 1]);
        const date_array = JSON.stringify(da);

        const InputFields2 = {
          student_id: user_id,
          event_name: event_name,
          event_color: event_color,
          event_note: event_note,
          event_start_date: d[0],
          event_end_date: d[d.length - 1],
          date_array: date_array,
          end_date: end,
          event_start_time: set_event_start_time,
          event_end_time: set_event_end_time,
          unique_key: unique_key,
          event_repeat_option: "Does not repeat",
          event_allDay: event_allDay,
          event_reminder: set_event_reminder,
          draggable_event: set_draggable_event,
          draggable_id: drag_id,
          type: type,
          status: "active",
          event_repeat_option_type: event_repeat_option,
          date: formattedDate,
          created_type: created_type,
          task_priority: task_priority,
          event_reminder_send: "",
          in_app_reminder: "",
          meeting_link: meeting_link,
          meeting_location: meeting_location,
          meeting_agenda: meeting_agenda,
          portfolio_id: portfolio_id,
          mfile: mfile_upload,
        };

        const paramNamesString2 = Object.keys(InputFields2).join(", ");
        const paramValuesString2 = Object.values(InputFields2)
          .map((value) => `'${value}'`)
          .join(", ");

        await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
          paramNamesString2,
          paramValuesString2,
        ]);

        const [insertedIdResult2] = await pool.execute(
          "SELECT @inserted_id_result AS inserted_id"
        );

        GetInsertedId.push(insertedIdResult2[0].inserted_id);
      }
    }

    if (event_repeat_option == "Custom") {
      const format = "Y-m-d";

      const array = [];
      const interval = 1;

      const realEnd = new Date(event_end_date);
      realEnd.setDate(realEnd.getDate() + 1);
      let current = moment(event_start_date).startOf("day");

      while (current < realEnd) {
        const formattedDate = current.format("YYYY-MM-DD");
        const day = current.format("ddd");

        array.push([formattedDate, day]);
        current.add(interval, "days");
      }

      const weekday_date = array.filter((d) => custom_check.includes(d[1]));

      let final = [];
      let array_key = 0;

      weekday_date.forEach((wd) => {
        if (!final[array_key]) {
          final[array_key] = [];
        }

        final[array_key].push(wd[0]);

        if (wd[1] === "Fri") {
          array_key++;
        }
      });

      const data1 = await Promise.all(
        weekday_date.map(async (d) => {
          const da = displayDates(d[0], d[0]);
          const date_array = JSON.stringify(da);

          const InputFields3 = {
            student_id: user_id,
            event_name: event_name,
            event_color: event_color,
            event_note: event_note,
            event_start_date: d[0],
            event_end_date: d[0],
            date_array: date_array,
            end_date: d[0],
            event_start_time: set_event_start_time,
            event_end_time: set_event_end_time,
            unique_key: unique_key,
            event_repeat_option: "Does not repeat",
            event_allDay: event_allDay,
            event_reminder: set_event_reminder,
            draggable_event: set_draggable_event,
            draggable_id: drag_id,
            type: type,
            status: "active",
            event_repeat_option_type: event_repeat_option,
            date: formattedDate,
            custom_all_day: custom_check.join(","),
            created_type: created_type,
            task_priority: task_priority,
            event_reminder_send: "",
            in_app_reminder: "",
            meeting_link: meeting_link,
            meeting_location: meeting_location,
            meeting_agenda: meeting_agenda,
            portfolio_id: portfolio_id,
            mfile: mfile_upload,
          };

          const paramNamesString3 = Object.keys(InputFields3).join(", ");
          const paramValuesString3 = Object.values(InputFields3)
            .map((value) => `'${value}'`)
            .join(", ");

          await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
            paramNamesString3,
            paramValuesString3,
          ]);

          const [insertedIdResult3] = await pool.execute(
            "SELECT @inserted_id_result AS inserted_id"
          );

          return insertedIdResult3[0]?.inserted_id;
        })
      );
      GetInsertedId.push(...data1);
    }

    if (event_repeat_option === "Weekly") {
      const start = moment(event_start_date);
      const end = moment(event_end_date);
      const format = "YYYY-MM-DD";

      const array = [];
      const interval = 1;

      const realEnd = moment(end).startOf("day");
      let current = moment(start).startOf("day");

      while (current.isSameOrBefore(realEnd)) {
        const formattedDate = current.format(format);
        const day = current.format("ddd");

        array.push([formattedDate, day]);
        current.add(interval, "days");
      }

      const customDateWeekly = array[0][1];

      const dArray = array;
      const weekdayDate = [];

      const customCheckArray = [customDateWeekly];

      for (const d of dArray) {
        for (const customCheck of customCheckArray) {
          if (d[1] === customCheck) {
            weekdayDate.push(d);
          }
        }
      }

      const final = [];
      let arrayKey = 0;

      weekdayDate.forEach((wd) => {
        if (!final[arrayKey]) {
          final[arrayKey] = [];
        }

        final[arrayKey].push(wd[0]);

        if (wd[1] === "Fri") {
          arrayKey++;
        }
      });

      const data1 = await Promise.all(
        weekdayDate.map(async (d) => {
          const da = displayDates(d[0], d[0]);
          const date_array = JSON.stringify(da);

          const InputFields4 = {
            student_id: user_id,
            event_name: event_name,
            event_color: event_color,
            event_note: event_note,
            event_start_date: d[0],
            event_end_date: d[0],
            date_array: date_array,
            end_date: d[0],
            event_start_time: set_event_start_time,
            event_end_time: set_event_end_time,
            unique_key: unique_key,
            event_repeat_option: "Does not repeat",
            event_allDay: event_allDay,
            event_reminder: set_event_reminder,
            draggable_event: set_draggable_event,
            draggable_id: drag_id,
            type: type,
            status: "active",
            event_repeat_option_type: event_repeat_option,
            date: formattedDate,
            created_type: created_type,
            task_priority: task_priority,
            event_reminder_send: "",
            in_app_reminder: "",
            meeting_link: meeting_link,
            meeting_location: meeting_location,
            meeting_agenda: meeting_agenda,
            portfolio_id: portfolio_id,
            mfile: mfile_upload,
          };

          const paramNamesString4 = Object.keys(InputFields4).join(", ");
          const paramValuesString4 = Object.values(InputFields4)
            .map((value) => `'${value}'`)
            .join(", ");

          await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
            paramNamesString4,
            paramValuesString4,
          ]);

          const [insertedIdResult4] = await pool.execute(
            "SELECT @inserted_id_result AS inserted_id"
          );

          return insertedIdResult4[0]?.inserted_id;
        })
      );

      GetInsertedId.push(...data1);
    }

    if (event_repeat_option == "Monthly") {
      const start = moment(event_start_date);
      const end = moment(event_end_date);
      const format = "YYYY-MM-DD";

      const array = [];
      const interval = 1;

      const realEnd = moment(end).startOf("day");
      let current = moment(start).startOf("day");

      while (current.isSameOrBefore(realEnd)) {
        const formattedDate = current.format(format);
        const day = current.format("D");

        array.push([formattedDate, day]);
        current.add(interval, "days");
      }

      const customDateMonthly = array;
      const firstDateGet = customDateMonthly[0][0];
      const newDateGet = customDateMonthly.map((item) => item[0]);

      let i = 0;
      const newArrayMonthlyDate = [];
      newDateGet.forEach((newDateGetNew) => {
        const newDate = moment(firstDateGet)
          .add(i, "months")
          .format("YYYY-MM-DD");
        if (newDate === newDateGetNew) {
          newArrayMonthlyDate.push(newDate);
          i++;
        }
      });

      const dArray = array;
      const weekdayDate = [];
      const customCheckArray = newArrayMonthlyDate;

      for (const d of dArray) {
        for (const customCheckArrayNew of customCheckArray) {
          if (d[0] === customCheckArrayNew) {
            weekdayDate.push(d);
          }
        }
      }

      const final = [];
      let arrayKey = 0;

      weekdayDate.forEach((wd) => {
        if (!final[arrayKey]) {
          final[arrayKey] = [];
        }

        final[arrayKey].push(wd[0]);

        if (wd[1] === "Fri") {
          arrayKey++;
        }
      });

      const data1 = await Promise.all(
        weekdayDate.map(async (d) => {
          const da = displayDates(d[0], d[0]);
          const date_array = JSON.stringify(da);

          const InputFields5 = {
            student_id: user_id,
            event_name: event_name,
            event_color: event_color,
            event_note: event_note,
            event_start_date: d[0],
            event_end_date: d[0],
            date_array: date_array,
            end_date: d[0],
            event_start_time: set_event_start_time,
            event_end_time: set_event_end_time,
            unique_key: unique_key,
            event_repeat_option: "Does not repeat",
            event_allDay: event_allDay,
            event_reminder: set_event_reminder,
            draggable_event: set_draggable_event,
            draggable_id: drag_id,
            type: type,
            status: "active",
            event_repeat_option_type: event_repeat_option,
            date: formattedDate,
            created_type: created_type,
            task_priority: task_priority,
            event_reminder_send: "",
            in_app_reminder: "",
            meeting_link: meeting_link,
            meeting_location: meeting_location,
            meeting_agenda: meeting_agenda,
            portfolio_id: portfolio_id,
            mfile: mfile_upload,
          };

          const paramNamesString5 = Object.keys(InputFields5).join(", ");
          const paramValuesString5 = Object.values(InputFields5)
            .map((value) => `'${value}'`)
            .join(", ");

          await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
            paramNamesString5,
            paramValuesString5,
          ]);

          const [insertedIdResult5] = await pool.execute(
            "SELECT @inserted_id_result AS inserted_id"
          );

          return insertedIdResult5[0]?.inserted_id;
        })
      );

      GetInsertedId.push(...data1);
    }

    if (event_repeat_option == "Yearly") {
      const format = "Y-m-d";
      const array = [];
      const interval = 1;

      const realEnd = new Date(event_end_date);
      realEnd.setFullYear(realEnd.getFullYear() + 1);
      let current = moment(event_start_date).startOf("day");

      while (current < realEnd) {
        const formattedDate = current.format("YYYY-MM-DD");
        const day = current.format("ddd");

        array.push([formattedDate, day]);
        current.add(interval, "days");
      }

      const custom_date_yearly = array.map(([date]) => date);
      const first_date_get = custom_date_yearly[0];

      let i = 0;
      const new_array_yearly_date = [];

      custom_date_yearly.forEach((new_date_get_new) => {
        const newDate = new Date(
          new Date(first_date_get).setFullYear(
            new Date(first_date_get).getFullYear() + i
          )
        );

        if (
          newDate >= new Date(event_start_date) &&
          newDate <= new Date(event_end_date)
        ) {
          new_array_yearly_date.push(newDate.toISOString().slice(0, 10));
        }
        i++;
      });

      const d_array = array;
      const weekday_date = [];

      const custom_check_array = new_array_yearly_date;

      d_array.forEach((d) => {
        custom_check_array.forEach((custom_check_array_new) => {
          if (d[0] === custom_check_array_new) {
            weekday_date.push(d);
          }
        });
      });

      const final = [];
      let array_key = 0;

      weekday_date.forEach((wd) => {
        final[array_key] = final[array_key] || [];
        final[array_key].push(wd[0]);

        if (wd[1] === "Fri") {
          array_key++;
        }
      });

      const data1 = await Promise.all(
        weekday_date.map(async (d) => {
          const da = displayDates(d[0], d[0]);
          const date_array = JSON.stringify(da);

          const InputFields6 = {
            student_id: user_id,
            event_name: event_name,
            event_color: event_color,
            event_note: event_note,
            event_start_date: d[0],
            event_end_date: d[0],
            date_array: date_array,
            end_date: d[0],
            event_start_time: set_event_start_time,
            event_end_time: set_event_end_time,
            unique_key: unique_key,
            event_repeat_option: "Does not repeat",
            event_allDay: event_allDay,
            event_reminder: set_event_reminder,
            draggable_event: set_draggable_event,
            draggable_id: drag_id,
            type: type,
            status: "active",
            event_repeat_option_type: event_repeat_option,
            date: formattedDate,
            created_type: created_type,
            task_priority: task_priority,
            event_reminder_send: "",
            in_app_reminder: "",
            meeting_link: meeting_link,
            meeting_location: meeting_location,
            meeting_agenda: meeting_agenda,
            portfolio_id: portfolio_id,
            mfile: mfile_upload,
          };

          const paramNamesString6 = Object.keys(InputFields6).join(", ");
          const paramValuesString6 = Object.values(InputFields6)
            .map((value) => `'${value}'`)
            .join(", ");

          await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
            paramNamesString6,
            paramValuesString6,
          ]);

          const [insertedIdResult6] = await pool.execute(
            "SELECT @inserted_id_result AS inserted_id"
          );

          return insertedIdResult6[0]?.inserted_id;
        })
      );

      GetInsertedId.push(...data1);
    }

    res.status(200).json({
      message: "Created successfully.",
      InsertedId: GetInsertedId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update_calendar_data
router.patch("/calendar/update-calendar-data", async (req, res) => {
  try {
    const {
      update_check_value,
      event_id,
      event_unique_key,
      user_id,
      event_repeat_option,
      created_type,
      portfolio_id,
      mfile,
      event_allDay,
      event_reminder_new,
      event_reminder,
      event_start_date,
      event_end_date,
      event_start_time,
      event_end_time,
      event_name,
      event_color,
      event_note,
      task_priority,
      meeting_link,
      meeting_location,
      meeting_agenda,
      custom_check,
    } = req.body;

    let set_draggable_event = "";
    let set_event_reminder;
    let set_event_start_time;
    let set_event_end_time;
    let mfile_upload;

    if (
      event_repeat_option == "Daily" ||
      event_repeat_option == "Does not repeat"
    ) {
      if (created_type == "meeting") {
        set_draggable_event = "";
      } else if (created_type == "event" && portfolio_id !== "") {
        set_draggable_event = "";
      } else {
        set_draggable_event = "on";
      }
    }

    if (event_allDay == "true") {
      set_event_reminder = event_reminder_new;
      set_event_start_time = "00:00:00";
      set_event_end_time = "00:00:00";
    } else {
      set_event_reminder = event_reminder;
      set_event_start_time = event_start_time;
      set_event_end_time = event_end_time;
    }

    if (created_type == "meeting" || created_type == "event") {
      mfile_upload = mfile.join(",");
    }

    //Update All
    if (update_check_value == "1") {
      //Get Old Event Details and Delete those events
      const [getAllEventsIDsRes] = await pool.execute(
        "CALL get_events_all_series(?)",
        [event_unique_key]
      );
      const getAllEventsID = getAllEventsIDsRes[0];

      const eventOldKey = getAllEventsIDsRes[0][0]?.unique_key;
      let eventOldIDs = [];
      const IDResults = await Promise.all(
        getAllEventsID.map(async (evt) => {
          return evt?.id;
        })
      );
      eventOldIDs.push(...IDResults);

      await pool.execute("CALL DeleteEvent(?, ?)", [event_id, "1"]);
      //Get Old Event Details and Delete those events

      let GetInsertedId = [];
      const formattedDate = dateConversion();
      const unique_key = eventOldKey ?? uniqid();
      const type = "event";
      const drag_id = "no_drag_id";

      if (
        event_repeat_option == "Does not repeat" ||
        event_repeat_option == "Daily"
      ) {
        const dateArray = displayDates(event_start_date, event_end_date);
        const set_date_array = JSON.stringify(dateArray);

        const InputFields = {
          student_id: user_id,
          event_name: event_name,
          event_color: event_color,
          event_note: event_note,
          event_start_date: event_start_date,
          event_end_date: event_end_date,
          date_array: set_date_array,
          end_date: event_end_date,
          event_start_time: set_event_start_time,
          event_end_time: set_event_end_time,
          unique_key: unique_key,
          event_repeat_option: "Does not repeat",
          event_allDay: event_allDay,
          event_reminder: set_event_reminder,
          draggable_event: set_draggable_event,
          draggable_id: drag_id,
          type: type,
          status: "active",
          event_repeat_option_type: event_repeat_option,
          date: formattedDate,
          created_type: created_type,
          task_priority: task_priority,
          event_reminder_send: "",
          in_app_reminder: "",
          meeting_link: meeting_link,
          meeting_location: meeting_location,
          meeting_agenda: meeting_agenda,
          portfolio_id: portfolio_id,
          mfile: mfile_upload,
        };
        const paramNamesString = Object.keys(InputFields).join(", ");
        const paramValuesString = Object.values(InputFields)
          .map((value) => `'${value}'`)
          .join(", ");

        await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
          paramNamesString,
          paramValuesString,
        ]);

        const [insertedIdResult] = await pool.execute(
          "SELECT @inserted_id_result AS inserted_id"
        );

        GetInsertedId.push(insertedIdResult[0].inserted_id);
      }

      if (event_repeat_option == "Every Weekday") {
        const start = event_start_date;
        const end = event_end_date;
        const format = "YYYY-MM-DD";

        const array = [];
        const interval = moment.duration(1, "day");
        const realEnd = moment(end).startOf("day");
        let current = moment(start).startOf("day");

        while (current.isSameOrBefore(realEnd)) {
          const day = current.format("ddd");

          if (day !== "Sat" && day !== "Sun") {
            array.push([current.format(format), day]);
          }

          current.add(1, "day");
        }

        const final = [];
        let array_key = 0;

        array.forEach((wd) => {
          if (!final[array_key]) {
            final[array_key] = [];
          }

          final[array_key].push(wd[0]);

          if (wd[1] === "Fri") {
            array_key++;
          }
        });

        for (const d of final) {
          const da = displayDates(d[0], d[d.length - 1]);
          const date_array = JSON.stringify(da);

          const InputFields2 = {
            student_id: user_id,
            event_name: event_name,
            event_color: event_color,
            event_note: event_note,
            event_start_date: d[0],
            event_end_date: d[d.length - 1],
            date_array: date_array,
            end_date: end,
            event_start_time: set_event_start_time,
            event_end_time: set_event_end_time,
            unique_key: unique_key,
            event_repeat_option: "Does not repeat",
            event_allDay: event_allDay,
            event_reminder: set_event_reminder,
            draggable_event: set_draggable_event,
            draggable_id: drag_id,
            type: type,
            status: "active",
            event_repeat_option_type: event_repeat_option,
            date: formattedDate,
            created_type: created_type,
            task_priority: task_priority,
            event_reminder_send: "",
            in_app_reminder: "",
            meeting_link: meeting_link,
            meeting_location: meeting_location,
            meeting_agenda: meeting_agenda,
            portfolio_id: portfolio_id,
            mfile: mfile_upload,
          };

          const paramNamesString2 = Object.keys(InputFields2).join(", ");
          const paramValuesString2 = Object.values(InputFields2)
            .map((value) => `'${value}'`)
            .join(", ");

          await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
            paramNamesString2,
            paramValuesString2,
          ]);

          const [insertedIdResult2] = await pool.execute(
            "SELECT @inserted_id_result AS inserted_id"
          );

          GetInsertedId.push(insertedIdResult2[0].inserted_id);
        }
      }

      if (event_repeat_option == "Custom") {
        const format = "Y-m-d";

        const array = [];
        const interval = 1;

        const realEnd = new Date(event_end_date);
        realEnd.setDate(realEnd.getDate() + 1);
        let current = moment(event_start_date).startOf("day");

        while (current < realEnd) {
          const formattedDate = current.format("YYYY-MM-DD");
          const day = current.format("ddd");

          array.push([formattedDate, day]);
          current.add(interval, "days");
        }

        const weekday_date = array.filter((d) => custom_check.includes(d[1]));

        let final = [];
        let array_key = 0;

        weekday_date.forEach((wd) => {
          if (!final[array_key]) {
            final[array_key] = [];
          }

          final[array_key].push(wd[0]);

          if (wd[1] === "Fri") {
            array_key++;
          }
        });

        const data1 = await Promise.all(
          weekday_date.map(async (d) => {
            const da = displayDates(d[0], d[0]);
            const date_array = JSON.stringify(da);

            const InputFields3 = {
              student_id: user_id,
              event_name: event_name,
              event_color: event_color,
              event_note: event_note,
              event_start_date: d[0],
              event_end_date: d[0],
              date_array: date_array,
              end_date: d[0],
              event_start_time: set_event_start_time,
              event_end_time: set_event_end_time,
              unique_key: unique_key,
              event_repeat_option: "Does not repeat",
              event_allDay: event_allDay,
              event_reminder: set_event_reminder,
              draggable_event: set_draggable_event,
              draggable_id: drag_id,
              type: type,
              status: "active",
              event_repeat_option_type: event_repeat_option,
              date: formattedDate,
              custom_all_day: custom_check.join(","),
              created_type: created_type,
              task_priority: task_priority,
              event_reminder_send: "",
              in_app_reminder: "",
              meeting_link: meeting_link,
              meeting_location: meeting_location,
              meeting_agenda: meeting_agenda,
              portfolio_id: portfolio_id,
              mfile: mfile_upload,
            };

            const paramNamesString3 = Object.keys(InputFields3).join(", ");
            const paramValuesString3 = Object.values(InputFields3)
              .map((value) => `'${value}'`)
              .join(", ");

            await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
              paramNamesString3,
              paramValuesString3,
            ]);

            const [insertedIdResult3] = await pool.execute(
              "SELECT @inserted_id_result AS inserted_id"
            );

            return insertedIdResult3[0]?.inserted_id;
          })
        );
        GetInsertedId.push(...data1);
      }

      if (event_repeat_option === "Weekly") {
        const start = moment(event_start_date);
        const end = moment(event_end_date);
        const format = "YYYY-MM-DD";

        const array = [];
        const interval = 1;

        const realEnd = moment(end).startOf("day");
        let current = moment(start).startOf("day");

        while (current.isSameOrBefore(realEnd)) {
          const formattedDate = current.format(format);
          const day = current.format("ddd");

          array.push([formattedDate, day]);
          current.add(interval, "days");
        }

        const customDateWeekly = array[0][1];

        const dArray = array;
        const weekdayDate = [];

        const customCheckArray = [customDateWeekly];

        for (const d of dArray) {
          for (const customCheck of customCheckArray) {
            if (d[1] === customCheck) {
              weekdayDate.push(d);
            }
          }
        }

        const final = [];
        let arrayKey = 0;

        weekdayDate.forEach((wd) => {
          if (!final[arrayKey]) {
            final[arrayKey] = [];
          }

          final[arrayKey].push(wd[0]);

          if (wd[1] === "Fri") {
            arrayKey++;
          }
        });

        const data1 = await Promise.all(
          weekdayDate.map(async (d) => {
            const da = displayDates(d[0], d[0]);
            const date_array = JSON.stringify(da);

            const InputFields4 = {
              student_id: user_id,
              event_name: event_name,
              event_color: event_color,
              event_note: event_note,
              event_start_date: d[0],
              event_end_date: d[0],
              date_array: date_array,
              end_date: d[0],
              event_start_time: set_event_start_time,
              event_end_time: set_event_end_time,
              unique_key: unique_key,
              event_repeat_option: "Does not repeat",
              event_allDay: event_allDay,
              event_reminder: set_event_reminder,
              draggable_event: set_draggable_event,
              draggable_id: drag_id,
              type: type,
              status: "active",
              event_repeat_option_type: event_repeat_option,
              date: formattedDate,
              created_type: created_type,
              task_priority: task_priority,
              event_reminder_send: "",
              in_app_reminder: "",
              meeting_link: meeting_link,
              meeting_location: meeting_location,
              meeting_agenda: meeting_agenda,
              portfolio_id: portfolio_id,
              mfile: mfile_upload,
            };

            const paramNamesString4 = Object.keys(InputFields4).join(", ");
            const paramValuesString4 = Object.values(InputFields4)
              .map((value) => `'${value}'`)
              .join(", ");

            await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
              paramNamesString4,
              paramValuesString4,
            ]);

            const [insertedIdResult4] = await pool.execute(
              "SELECT @inserted_id_result AS inserted_id"
            );

            return insertedIdResult4[0]?.inserted_id;
          })
        );

        GetInsertedId.push(...data1);
      }

      if (event_repeat_option == "Monthly") {
        const start = moment(event_start_date);
        const end = moment(event_end_date);
        const format = "YYYY-MM-DD";

        const array = [];
        const interval = 1;

        const realEnd = moment(end).startOf("day");
        let current = moment(start).startOf("day");

        while (current.isSameOrBefore(realEnd)) {
          const formattedDate = current.format(format);
          const day = current.format("D");

          array.push([formattedDate, day]);
          current.add(interval, "days");
        }

        const customDateMonthly = array;
        const firstDateGet = customDateMonthly[0][0];
        const newDateGet = customDateMonthly.map((item) => item[0]);

        let i = 0;
        const newArrayMonthlyDate = [];
        newDateGet.forEach((newDateGetNew) => {
          const newDate = moment(firstDateGet)
            .add(i, "months")
            .format("YYYY-MM-DD");
          if (newDate === newDateGetNew) {
            newArrayMonthlyDate.push(newDate);
            i++;
          }
        });

        const dArray = array;
        const weekdayDate = [];
        const customCheckArray = newArrayMonthlyDate;

        for (const d of dArray) {
          for (const customCheckArrayNew of customCheckArray) {
            if (d[0] === customCheckArrayNew) {
              weekdayDate.push(d);
            }
          }
        }

        const final = [];
        let arrayKey = 0;

        weekdayDate.forEach((wd) => {
          if (!final[arrayKey]) {
            final[arrayKey] = [];
          }

          final[arrayKey].push(wd[0]);

          if (wd[1] === "Fri") {
            arrayKey++;
          }
        });

        const data1 = await Promise.all(
          weekdayDate.map(async (d) => {
            const da = displayDates(d[0], d[0]);
            const date_array = JSON.stringify(da);

            const InputFields5 = {
              student_id: user_id,
              event_name: event_name,
              event_color: event_color,
              event_note: event_note,
              event_start_date: d[0],
              event_end_date: d[0],
              date_array: date_array,
              end_date: d[0],
              event_start_time: set_event_start_time,
              event_end_time: set_event_end_time,
              unique_key: unique_key,
              event_repeat_option: "Does not repeat",
              event_allDay: event_allDay,
              event_reminder: set_event_reminder,
              draggable_event: set_draggable_event,
              draggable_id: drag_id,
              type: type,
              status: "active",
              event_repeat_option_type: event_repeat_option,
              date: formattedDate,
              created_type: created_type,
              task_priority: task_priority,
              event_reminder_send: "",
              in_app_reminder: "",
              meeting_link: meeting_link,
              meeting_location: meeting_location,
              meeting_agenda: meeting_agenda,
              portfolio_id: portfolio_id,
              mfile: mfile_upload,
            };

            const paramNamesString5 = Object.keys(InputFields5).join(", ");
            const paramValuesString5 = Object.values(InputFields5)
              .map((value) => `'${value}'`)
              .join(", ");

            await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
              paramNamesString5,
              paramValuesString5,
            ]);

            const [insertedIdResult5] = await pool.execute(
              "SELECT @inserted_id_result AS inserted_id"
            );

            return insertedIdResult5[0]?.inserted_id;
          })
        );

        GetInsertedId.push(...data1);
      }

      if (event_repeat_option == "Yearly") {
        const format = "Y-m-d";
        const array = [];
        const interval = 1;

        const realEnd = new Date(event_end_date);
        realEnd.setFullYear(realEnd.getFullYear() + 1);
        let current = moment(event_start_date).startOf("day");

        while (current < realEnd) {
          const formattedDate = current.format("YYYY-MM-DD");
          const day = current.format("ddd");

          array.push([formattedDate, day]);
          current.add(interval, "days");
        }

        const custom_date_yearly = array.map(([date]) => date);
        const first_date_get = custom_date_yearly[0];

        let i = 0;
        const new_array_yearly_date = [];

        custom_date_yearly.forEach((new_date_get_new) => {
          const newDate = new Date(
            new Date(first_date_get).setFullYear(
              new Date(first_date_get).getFullYear() + i
            )
          );

          if (
            newDate >= new Date(event_start_date) &&
            newDate <= new Date(event_end_date)
          ) {
            new_array_yearly_date.push(newDate.toISOString().slice(0, 10));
          }
          i++;
        });

        const d_array = array;
        const weekday_date = [];

        const custom_check_array = new_array_yearly_date;

        d_array.forEach((d) => {
          custom_check_array.forEach((custom_check_array_new) => {
            if (d[0] === custom_check_array_new) {
              weekday_date.push(d);
            }
          });
        });

        const final = [];
        let array_key = 0;

        weekday_date.forEach((wd) => {
          final[array_key] = final[array_key] || [];
          final[array_key].push(wd[0]);

          if (wd[1] === "Fri") {
            array_key++;
          }
        });

        const data1 = await Promise.all(
          weekday_date.map(async (d) => {
            const da = displayDates(d[0], d[0]);
            const date_array = JSON.stringify(da);

            const InputFields6 = {
              student_id: user_id,
              event_name: event_name,
              event_color: event_color,
              event_note: event_note,
              event_start_date: d[0],
              event_end_date: d[0],
              date_array: date_array,
              end_date: d[0],
              event_start_time: set_event_start_time,
              event_end_time: set_event_end_time,
              unique_key: unique_key,
              event_repeat_option: "Does not repeat",
              event_allDay: event_allDay,
              event_reminder: set_event_reminder,
              draggable_event: set_draggable_event,
              draggable_id: drag_id,
              type: type,
              status: "active",
              event_repeat_option_type: event_repeat_option,
              date: formattedDate,
              created_type: created_type,
              task_priority: task_priority,
              event_reminder_send: "",
              in_app_reminder: "",
              meeting_link: meeting_link,
              meeting_location: meeting_location,
              meeting_agenda: meeting_agenda,
              portfolio_id: portfolio_id,
              mfile: mfile_upload,
            };

            const paramNamesString6 = Object.keys(InputFields6).join(", ");
            const paramValuesString6 = Object.values(InputFields6)
              .map((value) => `'${value}'`)
              .join(", ");

            await pool.execute("CALL InsertEvent(?, ?, @inserted_id_result)", [
              paramNamesString6,
              paramValuesString6,
            ]);

            const [insertedIdResult6] = await pool.execute(
              "SELECT @inserted_id_result AS inserted_id"
            );

            return insertedIdResult6[0]?.inserted_id;
          })
        );

        GetInsertedId.push(...data1);
      }

      for (let i = 0; i < eventOldIDs.length; i++) {
        const extract_id = eventOldIDs[i];

        const [getEventTodoRes] = await pool.execute("CALL getEventTodo(?,?)", [
          user_id,
          extract_id,
        ]);

        const getEventTodo = getEventTodoRes[0];

        if (getEventTodo && getEventTodo.length > 0) {
          await Promise.all(
            getEventTodo.map(async (todo) => {
              const dynamicFieldsValues = `event_id = '${GetInsertedId[i]}',
                                           parent_event_id = '${GetInsertedId[i]}'`;
              const id = `event_id  = '${extract_id}'`;

              await pool.execute("CALL UpdateEventsTodo(?, ?)", [
                dynamicFieldsValues,
                id,
              ]);
            })
          );
        }
      }

      res.status(200).json({
        message: "Update Successfully",
      });
    }
    //Update This and Following
    else if (update_check_value == "2") {
      const InputFields = {
        event_name: event_name,
        event_color: event_color,
        event_note: event_note,
        event_start_time: set_event_start_time,
        event_end_time: set_event_end_time,
        event_allDay: event_allDay,
        event_reminder: set_event_reminder,
        draggable_event: set_draggable_event,
        task_priority: task_priority,
        event_reminder_send: "",
        in_app_reminder: "",
        meeting_link: meeting_link,
        meeting_location: meeting_location,
        meeting_agenda: meeting_agenda,
        portfolio_id: portfolio_id,
        mfile: mfile_upload,
      };

      const formattedParams = convertObjectToProcedureParams(InputFields);

      const storedProcedure = `CALL UpdateEvents('${formattedParams}', 'id >= "${event_id}" and unique_key = "${event_unique_key}"')`;

      await pool.execute(storedProcedure);
      res.status(200).json({
        message: "Update Successfully",
      });
    }
    //Update This
    else if (update_check_value == "3") {
      const InputFields = {
        event_name: event_name,
        event_color: event_color,
        event_note: event_note,
        event_start_time: set_event_start_time,
        event_end_time: set_event_end_time,
        event_allDay: event_allDay,
        event_reminder: set_event_reminder,
        draggable_event: set_draggable_event,
        task_priority: task_priority,
        event_reminder_send: "",
        in_app_reminder: "",
        meeting_link: meeting_link,
        meeting_location: meeting_location,
        meeting_agenda: meeting_agenda,
        portfolio_id: portfolio_id,
        mfile: mfile_upload,
      };

      const formattedParams = convertObjectToProcedureParams(InputFields);

      const storedProcedure = `CALL UpdateEvents('${formattedParams}', 'id = ${event_id}')`;

      await pool.execute(storedProcedure);
      res.status(200).json({
        message: "Update Successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//delete_calendar_data
router.delete(
  "/calendar/delete-calendar-data/:event_id/:delete_check",
  async (req, res) => {
    try {
      const event_id = req.params.event_id;
      const delete_check = req.params.delete_check;

      await pool.execute("CALL DeleteEvent(?, ?)", [event_id, delete_check]);

      res.status(200).json({
        message: "Deleted Successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//insert_drag_from
router.post("/calendar/insert-drag-from", async (req, res) => {
  try {
    const {
      user_id,
      event_allDay_drag,
      event_reminder_new,
      event_reminder,
      event_start_time,
      event_end_time,
      ...otherFields
    } = req.body;
    let set_event_reminder;
    let set_event_start_time;
    let set_event_end_time;

    if (event_allDay_drag == "true") {
      set_event_reminder = event_reminder_new;
      set_event_start_time = "00:00:00";
      set_event_end_time = "00:00:00";
    } else {
      set_event_reminder = event_reminder;
      set_event_start_time = event_start_time;
      set_event_end_time = event_end_time;
    }

    const formattedDate = dateConversion();
    const currentDate = moment().format("YYYY-MM-DD");
    const additionalFields = {
      student_id: user_id,
      event_start_date: currentDate,
      event_end_date: currentDate,
      event_start_time: set_event_start_time,
      event_end_time: set_event_end_time,
      event_repeat_option: "Does not repeat",
      event_allDay: event_allDay_drag,
      event_reminder: set_event_reminder,
      show_draggable_event: 1,
      status: "active",
      date: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertDraggableEvent(?, ?, @inserted_id_result)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(200).json({
      message: "Created Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update_drag_event
router.patch("/calendar/update-drag-from", async (req, res) => {
  try {
    const {
      user_id,
      drag_id,
      event_allDay_drag,
      event_reminder_new,
      event_reminder,
      event_start_time,
      event_end_time,
      ...otherFields
    } = req.body;
    let set_event_reminder;
    let set_event_start_time;
    let set_event_end_time;

    if (event_allDay_drag == "true") {
      set_event_reminder = event_reminder_new;
      set_event_start_time = "00:00:00";
      set_event_end_time = "00:00:00";
    } else {
      set_event_reminder = event_reminder;
      set_event_start_time = event_start_time;
      set_event_end_time = event_end_time;
    }

    const formattedDate = dateConversion();
    const currentDate = moment().format("YYYY-MM-DD");
    const additionalFields = {
      student_id: user_id,
      event_start_date: currentDate,
      event_end_date: currentDate,
      event_start_time: set_event_start_time,
      event_end_time: set_event_end_time,
      event_repeat_option: "Does not repeat",
      event_allDay: event_allDay_drag,
      event_reminder: set_event_reminder,
      show_draggable_event: 1,
      status: "active",
      date: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };

    const formattedParams = convertObjectToProcedureParams(
      requestBodyWithAdditionalFields
    );

    const storedProcedure = `CALL UpdateDraggableEvents('${formattedParams}', 'id = ${drag_id}')`;

    await pool.execute(storedProcedure);

    res.status(200).json({
      message: "Update Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//delete_drag_event
router.delete("/calendar/delete-drag-event/:drag_id", async (req, res) => {
  try {
    const drag_id = req.params.drag_id;

    const del1 = `id = '${drag_id}'`;
    await pool.execute("CALL DeleteDraggableEvents(?)", [del1]);

    res.status(200).json({
      message: "Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//insert_events_todo
router.post("/calendar/insert-events-todo", async (req, res) => {
  try {
    const { user_id, task_allDay, task_start_time, event_id, ...otherFields } =
      req.body;

    let set_task_start_time;

    if (task_allDay == "true") {
      set_task_start_time = "00:00:00";
    } else {
      set_task_start_time = task_start_time;
    }

    const formattedDate = dateConversion();
    const additionalFields = {
      student_id: user_id,
      parent_event_id: event_id,
      event_id: event_id,
      task_start_time: set_task_start_time,
      task_allDay: task_allDay,
      multiple_events: "0",
      status: "active",
      date: formattedDate,
    };

    const requestBodyWithAdditionalFields = {
      ...otherFields,
      ...additionalFields,
    };
    const paramNamesString = Object.keys(requestBodyWithAdditionalFields).join(
      ", "
    );
    const paramValuesString = Object.values(requestBodyWithAdditionalFields)
      .map((value) => `'${value}'`)
      .join(", ");

    const callProcedureSQL = `CALL InsertEventsTodo(?, ?, @inserted_id_result)`;
    await pool.execute(callProcedureSQL, [paramNamesString, paramValuesString]);

    res.status(200).json({
      message: "Created Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//update_events_todo
router.patch("/calendar/update-events-todo", async (req, res) => {
  try {
    const { user_id, event_id, todo_id, ...otherFields } = req.body;

    const formattedParams = convertObjectToProcedureParams(otherFields);

    const storedProcedure = `CALL UpdateEventsTodo('${formattedParams}', 'id = ${todo_id}')`;

    await pool.execute(storedProcedure);

    const [tasks] = await pool.execute("CALL getEventTodo(?,?)", [
      user_id,
      event_id,
    ]);

    const task_count = tasks[0].length;

    const [comp_tasks] = await pool.execute(
      "CALL getCompleteEventTodoCount(?,?)",
      [user_id, event_id]
    );

    const comp_tasks_count = comp_tasks[0][0]?.complete_count;

    const todo_percent = Math.round((comp_tasks_count / task_count) * 100);

    res.status(200).json({
      message: "Update Successfully",
      todo_percent: todo_percent,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//delete_events_todo
router.delete(
  "/calendar/delete-events-todo/:user_id/:event_id/:todo_id",
  async (req, res) => {
    try {
      const user_id = req.params.user_id;
      const event_id = req.params.event_id;
      const todo_id = req.params.todo_id;

      const del1 = `id = '${todo_id}'`;
      await pool.execute("CALL DeleteEventsTodo(?)", [del1]);

      const [tasks] = await pool.execute("CALL getEventTodo(?,?)", [
        user_id,
        event_id,
      ]);

      const task_count = tasks[0].length;

      const [comp_tasks] = await pool.execute(
        "CALL getCompleteEventTodoCount(?,?)",
        [user_id, event_id]
      );

      const comp_tasks_count = comp_tasks[0][0]?.complete_count;

      const todo_percent = Math.round((comp_tasks_count / task_count) * 100);

      res.status(200).json({
        message: "Deleted Successfully",
        todo_percent: todo_percent,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

//remove_file
router.patch("/calendar/remove-file", async (req, res) => {
  try {
    const { index_id, event_id } = req.body;

    const [e_detailRes] = await pool.execute("CALL getEventDetail(?)", [
      event_id,
    ]);

    const e_detail = e_detailRes[0][0];

    const mfile = e_detail.mfile.split(",");

    const mfile_name = mfile[index_id];

    const new_files = mfile.filter((file) => file !== mfile_name);

    const new_string_file = new_files.join(",");

    const dynamicFieldsValues = `mfile = '${new_string_file}'`;
    const id = `id  = '${event_id}'`;
    await pool.execute("CALL UpdateEvents(?, ?)", [dynamicFieldsValues, id]);

    res.status(200).json({
      message: "Removed Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//calendar_event_list
router.get("/calendar/calendar-event-list/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const today = moment().format("YYYY-MM-DD");

    const [getAll_NextEventsRes] = await pool.execute(
      "CALL getAll_NextEvents(?,?)",
      [today, user_id]
    );

    const getAll_NextEventsResults = getAll_NextEventsRes[0];

    const promisesgetAll_NextEvents = getAll_NextEventsResults.map(
      async (item) => {
        const { id } = item;
        try {
          const [tasks] = await pool.execute("CALL getEventTodo(?,?)", [
            user_id,
            id,
          ]);
          const TODOs = tasks[0];
          const task_count = tasks[0].length;

          const [comp_tasks] = await pool.execute(
            "CALL getCompleteEventTodoCount(?,?)",
            [user_id, id]
          );

          const comp_tasks_count = comp_tasks[0][0]?.complete_count;
          let todo_percent = 0;
          todo_percent = Math.round((comp_tasks_count / task_count) * 100);

          if (todo_percent == null || isNaN(todo_percent)) {
            todo_percent = 0;
          }

          const data = {
            ...item,
            TODOs,
            todo_percent,
          };

          return data;
        } catch (error) {
          return {
            ...item,
            TODOs: [],
            todo_percent: 0,
          };
        }
      }
    );

    const promisesgetAll_NextEventsResults = await Promise.all(
      promisesgetAll_NextEvents
    );

    res.status(200).json({
      getAll_NextEvents: promisesgetAll_NextEventsResults,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//calendar_todo_list
router.get("/calendar/calendar-todo-list/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const today = moment().format("YYYY-MM-DD");

    const [getAll_NextTodosRes] = await pool.execute(
      "CALL getAll_NextTodos(?,?)",
      [today, user_id]
    );

    const getAll_NextTodosResults = getAll_NextTodosRes[0];

    const promisesgetAll_NextTodos = getAll_NextTodosResults.map(
      async (item) => {
        const { id } = item;
        try {
          const [tasks] = await pool.execute("CALL getEventTodo(?,?)", [
            user_id,
            id,
          ]);
          const TODOs = tasks[0];
          const task_count = tasks[0].length;

          const [comp_tasks] = await pool.execute(
            "CALL getCompleteEventTodoCount(?,?)",
            [user_id, id]
          );

          const comp_tasks_count = comp_tasks[0][0]?.complete_count;
          let todo_percent = 0;
          todo_percent = Math.round((comp_tasks_count / task_count) * 100);

          if (todo_percent == null || isNaN(todo_percent)) {
            todo_percent = 0;
          }

          const data = {
            ...item,
            TODOs,
            todo_percent,
          };

          return data;
        } catch (error) {
          return {
            ...item,
            TODOs: [],
            todo_percent: 0,
          };
        }
      }
    );

    const promisesgetAll_NextTodosResults = await Promise.all(
      promisesgetAll_NextTodos
    );

    res.status(200).json({
      getAll_NextTodos: promisesgetAll_NextTodosResults,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//calendar_meeting_list
router.get("/calendar/calendar-meeting-list/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const today = moment().format("YYYY-MM-DD");

    const [getAll_NextMeetingsRes] = await pool.execute(
      "CALL getAll_NextMeetings(?,?)",
      [today, user_id]
    );

    const getAll_NextMeetingsResults = getAll_NextMeetingsRes[0];

    const promisesgetAll_NextMeetings = getAll_NextMeetingsResults.map(
      async (item) => {
        const { id } = item;
        try {
          const [tasks] = await pool.execute("CALL getEventTodo(?,?)", [
            user_id,
            id,
          ]);
          const TODOs = tasks[0];
          const task_count = tasks[0].length;

          const [comp_tasks] = await pool.execute(
            "CALL getCompleteEventTodoCount(?,?)",
            [user_id, id]
          );

          const comp_tasks_count = comp_tasks[0][0]?.complete_count;
          let todo_percent = 0;
          todo_percent = Math.round((comp_tasks_count / task_count) * 100);

          if (todo_percent == null || isNaN(todo_percent)) {
            todo_percent = 0;
          }

          const data = {
            ...item,
            TODOs,
            todo_percent,
          };

          return data;
        } catch (error) {
          return {
            ...item,
            TODOs: [],
            todo_percent: 0,
          };
        }
      }
    );

    const promisesgetAll_NextMeetingsResults = await Promise.all(
      promisesgetAll_NextMeetings
    );

    res.status(200).json({
      getAll_NextMeetings: promisesgetAll_NextMeetingsResults,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
