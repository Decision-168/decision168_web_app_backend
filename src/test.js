const obj = {
  tid: 0,
  stproject_assign: 0,
  sid: 0,
  gid: 0,
  dept: 0,
  taskArray: [],
};

console.log(JSON.stringify(obj));

const data = {
  tid: 0,
  stproject_assign: 0,
  sid: 0,
  gid: 0,
  dept: 0,
  taskArray: [
    {
      team_member2: 1,
      slinks: [{ 0: "link1" }, { 1: "link2" }],
      slink_comments: [{ 0: "comment" }, { 1: "comment2" }],
      stname: "my New SubTask",
      stdes: "my Sutask description",
      stnote: "this is my test note",
      stfile: [{ 0: "file1" }, { 1: "file2" }],
      stpriority: "low",
      stdue_date: "2023-12-15",
    },
  ],
};

const newDate = {
  tid: 0,
  stproject_assign: 0,
  sid: 0,
  gid: 0,
  dept: 0,
  taskArray: [
    {
      team_member2: 1,
      slinks: [{ 0: "link1" }, { 1: "link2" }],
      slink_comments: [{ 0: "comment" }, { 1: "comment2" }],
      stname: "my New SubTask",
      stdes: "my Sutask description",
      stnote: "this is my test note",
      stfile: [{ 0: "file1" }, { 1: "file2" }],
      stpriority: "low",
      stdue_date: "2023-12-15",
    },
  ],
};

console.log(JSON.stringify(data));

const editeData = {
  stid: 0,
  stproject_assign: 0,
  team_member2: 0,
  slinks: [],
  slink_comments: [],
  sid: 0,
  gid: 0,
  stname: "",
  stdes: "",
  stnote: "",
  stfile: [],
  tpriority: "",
  dept: 0,
  tdue_date: "",
};
