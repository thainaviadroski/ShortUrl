CREATE TABLE "link_clicks" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_id" integer NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"browser" varchar(100),
	"os" varchar(100),
	"device" varchar(100),
	"referer" text,
	"country" varchar(2),
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links_shorted" (
	"id" serial PRIMARY KEY NOT NULL,
	"link_original" text NOT NULL,
	"link_short" varchar(10) NOT NULL,
	"max_time_valid" timestamp,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"qr_code_url" text,
	"created" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "links_shorted_link_short_unique" UNIQUE("link_short")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "link_clicks" ADD CONSTRAINT "link_clicks_link_id_links_shorted_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links_shorted"("id") ON DELETE cascade ON UPDATE no action;