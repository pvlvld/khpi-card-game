CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE oauth_provider (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- union?
    provider_id VARCHAR(255) NOT NULL, -- ID provided by the OAuth provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (provider, provider_id)
);

CREATE TABLE accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  provider VARCHAR(50) NOT NULL,    -- "credentials", "google", "github", etc.
  provider_id VARCHAR(100) NOT NULL,     -- provider ID / user_id for local auth
  password_hash VARCHAR(255),            -- "credentials" aka local auth
  UNIQUE KEY (provider, provider_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- A tie? nah! :D
CREATE TABLE game (
    id SERIAL PRIMARY KEY,
    winner_id INTEGER NOT NULL REFERENCES user(id) ON DELETE SET NULL,
    loser_id INTEGER NOT NULL REFERENCES user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    health INTEGER NOT NULL,
    damage INTEGER NOT NULL,
    cost INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name)
)