import { Knex } from "knex";

export async function up(knex: Knex) {
	return knex.schema
		.createTable("course", tb=>{
			tb.bigIncrements("id");

			tb.text("subject").notNullable().index();
			tb.integer("course").notNullable().index();
			tb.text("name").notNullable();

			tb.jsonb("data").notNullable();
			tb.unique(["subject", "course", "name"]);
		})
		.createTable("instructor", tb=>{
			tb.bigIncrements("id");

			tb.text("name").unique().notNullable();
			tb.jsonb("rmp");
			tb.jsonb("data").notNullable();
		})
		.createTable("course_instructor", tb=>{
			tb.integer("course").references("course.id").onDelete("CASCADE");
			tb.text("instructor").references("instructor.name").onDelete("CASCADE");
			tb.primary(["course", "instructor"]);
		})
		.createTable("term", tb=>{
			tb.text("id").primary().notNullable();
			tb.text("purdue_id").notNullable();
			tb.text("name").notNullable();
			tb.timestamp("last_updated").notNullable();
		})
		.createTable("subject", tb=>{
			tb.text("abbr").primary().notNullable();
			tb.text("name").notNullable();
		})
		.createTable("attribute", tb=>{
			tb.text("id").primary().notNullable();
			tb.text("name").notNullable();
		})
		.createTable("scheduleType", tb=>{
			tb.text("name").notNullable().primary();
		});
}

export function down(knex: Knex) {
	return knex.schema
		.dropTable("course_instructor")
		.dropTable("course")
		.dropTable("instructor")
		.dropTable("term")
		.dropTable("subject")
		.dropTable("attribute")
		.dropTable("scheduleType");
}