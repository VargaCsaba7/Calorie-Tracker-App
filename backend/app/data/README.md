# Exercise data

`exercises.json` is the [free-exercise-db](https://github.com/yuhonas/free-exercise-db) dataset
(876 exercises with instructions, target muscles and photos). It is released into the public domain
under the Unlicense. The photos are loaded from that repository on GitHub, not stored here.

The data is loaded into the `exercise_library` table by the Alembic migration
`0006_exercise_library`.
