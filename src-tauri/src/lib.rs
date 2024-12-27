// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }
use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    path TEXT UNIQUE, 
                    data JSON -- TODO: depth INTEGER GENERATED ALWAYS AS (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) STORED
                );
                CREATE INDEX idx_messages_path ON messages(path);
                -- TODO: CREATE INDEX idx_nodes_depth ON nodes(depth);

                CREATE VIEW message_view AS SELECT 
                    id, 
                    path, 
                    json_extract(data, '$.message') AS message 
                FROM
                    messages;

                CREATE VIRTUAL TABLE messages_fts USING fts5(
                    path UNINDEXED,
                    message, 
                    tokenize = 'trigram',
                    content = 'message_view', 
                    content_rowid = 'id'
                );

                -- Trigger for INSERT
                CREATE TRIGGER message_insert AFTER INSERT ON messages
                BEGIN
                    INSERT INTO messages_fts (rowid, path, message) SELECT NEW.id, NEW.path, json_extract(NEW.data, '$.message');
                END;

                -- Trigger for DELETE
                CREATE TRIGGER messages_delete AFTER DELETE ON messages
                BEGIN
                    INSERT INTO messages_fts(messages_fts, rowid, path, message) VALUES('delete', OLD.id, OLD.path, json_extract(OLD.data, '$.message'));
                END;
                    
                    -- Trigger for UPDATE
                CREATE TRIGGER messages_update AFTER UPDATE ON messages
                BEGIN
                    INSERT INTO messages_fts(messages_fts, rowid, path, message) VALUES('delete', OLD.id, OLD.path, json_extract(OLD.data, '$.message'));
                    INSERT INTO messages_fts (rowid, path, message) SELECT NEW.id, NEW.path, json_extract(NEW.data, '$.message');
                END;

                CREATE TABLE thread_titles (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL
                );

                CREATE TABLE providers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    name TEXT NOT NULL, endpoint TEXT NOT NULL, 
                    apiKey TEXT NOT NULL
                );

                CREATE TABLE models (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, 
                    name TEXT NOT NULL, 
                    model TEXT NOT NULL, 
                    providerId INTEGER NOT NULL, 
                    FOREIGN KEY (providerId) REFERENCES providers(id)
                );
            ",
            kind: MigrationKind::Up,
        },
    ];
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_cors_fetch::init())
        // .plugin(tauri_plugin_dialog::init())
        // .plugin(tauri_plugin_opener::init())
        // .invoke_handler(tauri::generate_handler![init_pandoc, get_file])
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mammal.db", migrations)
                .build(),
        )
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = window.set_min_size(Some(tauri::Size::Logical(tauri::LogicalSize {
                width: 1200.0,
                height: 800.0,
            })));
            window
                .set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: 1200.0,
                    height: 800.0,
                }))
                .unwrap();
            Ok(())
        });
    app.run(tauri::generate_context!())
        .expect("error while running tauri application");
}
