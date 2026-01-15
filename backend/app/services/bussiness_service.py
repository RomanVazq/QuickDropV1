from datetime import datetime
import pytz

def is_business_open(db: Session, tenant_id: int):
    # Obtener hora actual según zona horaria (puedes guardarla en el tenant)
    now = datetime.now(pytz.timezone('America/Mexico_City'))
    current_day = now.weekday()
    current_time = now.strftime("%H:%M")

    hour_config = db.query(base.BusinessHour).filter(
        base.BusinessHour.tenant_id == tenant_id,
        base.BusinessHour.day_of_week == current_day
    ).first()

    if not hour_config or hour_config.is_closed:
        return False

    return hour_config.open_time <= current_time <= hour_config.close_time