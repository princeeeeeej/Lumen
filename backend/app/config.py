from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Rag Assistant Api"
    secret_key: str = "changeme"
    hf_token: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
