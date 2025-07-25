#!/usr/bin/env python3
"""
Quick Unicode fix for all test files
"""

import os

def fix_file(filename):
    """Fix Unicode characters in a file"""
    if not os.path.exists(filename):
        print(f"File not found: {filename}")
        return False
    
    # Unicode replacements
    replacements = [
        ('🚀', '[START]'),
        ('✅', '[OK]'),  
        ('❌', '[ERROR]'),
        ('⚠️', '[WARNING]'),
        ('🔧', '[SETUP]'),
        ('📋', '[TESTS]'),
        ('📊', '[RESULTS]'),
        ('💾', '[SAVE]'),
        ('🏁', '[COMPLETED]'),
        ('🎉', '[SUCCESS]'),
        ('🛑', '[STOP]'),
        ('🔄', '[RUNNING]'),
        ('📅', 'Time:'),
        ('🧪', '[UNIT]'),
        ('🔗', '[INTEGRATION]'), 
        ('🌐', '[SYSTEM]'),
        ('📂', '[FILES]'),
        ('💡', '[INFO]'),
        ('⏱️', 'Duration:'),
        ('📄', 'File:'),
        ('✨', '[QUALITY]'),
        ('📈', 'Metrics:'),
        ('🔌', '[CONNECT]'),
        ('📡', '[API]'),
        ('🔒', '[SECURITY]'),
        ('⚡', '[PERFORMANCE]'),
        ('🎯', '[TARGET]'),
        ('🔍', '[CHECK]'),
        ('📝', '[REPORT]'),
        ('🌟', '[STAR]'),
        ('💻', '[COMPUTER]'),
        ('🖥️', '[SERVER]'),
        ('⏰', '[CLOCK]'),
        ('🕐', 'Start:'),
        ('📊', '[CHART]'),
        ('🔥', '[HOT]'),
        ('🚗', '[CAR]'),
        ('📞', '[PHONE]'),
        ('💰', '[MONEY]'),
        ('🏆', '[TROPHY]'),
        ('🎊', '[PARTY]'),
        ('🎪', '[CIRCUS]'),
        ('🎭', '[THEATER]'),
        ('⭐', '[STAR]'),
        ('💯', '[100]'),
        ('👍', '[THUMBS_UP]'),
        ('👎', '[THUMBS_DOWN]'),
        ('🔔', '[BELL]'),
        ('🔕', '[MUTE]'),
        ('📢', '[SPEAKER]'),
        ('📣', '[MEGAPHONE]'),
        ('💬', '[SPEECH]'),
        ('💭', '[THOUGHT]'),
        ('🗨️', '[SPEECH_BUBBLE]'),
        ('🗯️', '[ANGER_BUBBLE]'),
        ('💤', '[SLEEP]'),
        ('💥', '[EXPLOSION]'),
        ('💫', '[DIZZY]'),
        ('💦', '[SWEAT]'),
        ('💨', '[DASH]'),
        ('🕳️', '[HOLE]'),
        ('💣', '[BOMB]'),
        ('💢', '[ANGER]'),
        ('💔', '[BROKEN_HEART]'),
        ('💕', '[TWO_HEARTS]'),
        ('💖', '[SPARKLING_HEART]'),
        ('💗', '[GROWING_HEART]'),
        ('💘', '[HEART_ARROW]'),
        ('💙', '[BLUE_HEART]'),
        ('💚', '[GREEN_HEART]'),
        ('💛', '[YELLOW_HEART]'),
        ('💜', '[PURPLE_HEART]'),
        ('🖤', '[BLACK_HEART]'),
        ('🤍', '[WHITE_HEART]'),
        ('🤎', '[BROWN_HEART]'),
        ('❤️', '[RED_HEART]'),
        ('🧡', '[ORANGE_HEART]'),
        ('💞', '[REVOLVING_HEARTS]'),
        ('💟', '[HEART_DECORATION]'),
        ('❣️', '[HEART_EXCLAMATION]'),
        ('💌', '[LOVE_LETTER]'),
        ('💍', '[RING]'),
        ('💎', '[GEM]'),
        ('🔮', '[CRYSTAL_BALL]'),
        ('🪄', '[MAGIC_WAND]'),
        ('🧿', '[NAZAR_AMULET]'),
        ('📿', '[PRAYER_BEADS]'),
        ('🏺', '[AMPHORA]'),
        ('⚰️', '[COFFIN]'),
        ('🚬', '[CIGARETTE]'),
        ('⚱️', '[FUNERAL_URN]'),
        ('🗿', '[MOAI]'),
        ('🛸', '[UFO]'),
        ('🚁', '[HELICOPTER]'),
        ('🚂', '[LOCOMOTIVE]'),
        ('🚃', '[RAILWAY_CAR]'),
        ('🚄', '[HIGH_SPEED_TRAIN]'),
        ('🚅', '[BULLET_TRAIN]'),
        ('🚆', '[TRAIN]'),
        ('🚇', '[METRO]'),
        ('🚈', '[LIGHT_RAIL]'),
        ('🚉', '[STATION]'),
        ('🚊', '[TRAM]'),
        ('🚝', '[MONORAIL]'),
        ('🚞', '[MOUNTAIN_RAILWAY]'),
        ('🚋', '[TRAM_CAR]'),
        ('🚌', '[BUS]'),
        ('🚍', '[ONCOMING_BUS]'),
        ('🚎', '[TROLLEYBUS]'),
        ('🚐', '[MINIBUS]'),
        ('🚑', '[AMBULANCE]'),
        ('🚒', '[FIRE_ENGINE]'),
        ('🚓', '[POLICE_CAR]'),
        ('🚔', '[ONCOMING_POLICE_CAR]'),
        ('🚕', '[TAXI]'),
        ('🚖', '[ONCOMING_TAXI]'),
        ('🚗', '[AUTOMOBILE]'),
        ('🚘', '[ONCOMING_AUTOMOBILE]'),
        ('🚙', '[SPORT_UTILITY_VEHICLE]'),
        ('🚚', '[DELIVERY_TRUCK]'),
        ('🚛', '[ARTICULATED_LORRY]'),
        ('🚜', '[TRACTOR]'),
        ('🏎️', '[RACING_CAR]'),
        ('🏍️', '[MOTORCYCLE]'),
        ('🛵', '[MOTOR_SCOOTER]'),
        ('🚲', '[BICYCLE]'),
        ('🛴', '[KICK_SCOOTER]'),
        ('🛹', '[SKATEBOARD]'),
        ('🛼', '[ROLLER_SKATE]'),
        ('🚁', '[HELICOPTER]'),
        ('✈️', '[AIRPLANE]'),
        ('🛩️', '[SMALL_AIRPLANE]'),
        ('🛫', '[AIRPLANE_DEPARTURE]'),
        ('🛬', '[AIRPLANE_ARRIVAL]'),
        ('🪂', '[PARACHUTE]'),
        ('💺', '[SEAT]'),
        ('🚀', '[ROCKET]'),
        ('🛰️', '[SATELLITE]'),
        ('🚁', '[HELICOPTER]'),
        ('🛸', '[FLYING_SAUCER]'),
        ('⚓', '[ANCHOR]'),
        ('🚢', '[SHIP]'),
        ('🛥️', '[MOTOR_BOAT]'),
        ('🚤', '[SPEEDBOAT]'),
        ('⛵', '[SAILBOAT]'),
        ('🛶', '[CANOE]'),
        ('🚣', '[PERSON_ROWING_BOAT]'),
        ('🏊', '[PERSON_SWIMMING]'),
        ('⛷️', '[SKIER]'),
        ('🏂', '[SNOWBOARDER]'),
        ('🏌️', '[PERSON_GOLFING]'),
        ('🏄', '[PERSON_SURFING]'),
        ('🚴', '[PERSON_BIKING]'),
        ('🚵', '[PERSON_MOUNTAIN_BIKING]'),
        ('🤸', '[PERSON_CARTWHEELING]'),
        ('🤼', '[PEOPLE_WRESTLING]'),
        ('🤽', '[PERSON_PLAYING_WATER_POLO]'),
        ('🤾', '[PERSON_PLAYING_HANDBALL]'),
        ('🤹', '[PERSON_JUGGLING]'),
        ('🧘', '[PERSON_IN_LOTUS_POSITION]'),
        ('🛀', '[PERSON_TAKING_BATH]'),
        ('🛃', '[CUSTOMS]'),
        ('🛄', '[BAGGAGE_CLAIM]'),
        ('🛅', '[LEFT_LUGGAGE]'),
        ('🛂', '[PASSPORT_CONTROL]'),
        ('🛁', '[BATHTUB]'),
        ('🚿', '[SHOWER]'),
        ('🚽', '[TOILET]'),
        ('🚾', '[WATER_CLOSET]'),
        ('🧴', '[LOTION_BOTTLE]'),
        ('🧷', '[SAFETY_PIN]'),
        ('🧹', '[BROOM]'),
        ('🧺', '[BASKET]'),
        ('🧻', '[ROLL_OF_PAPER]'),
        ('🧼', '[BAR_OF_SOAP]'),
        ('🧽', '[SPONGE]'),
        ('🧯', '[FIRE_EXTINGUISHER]'),
        ('🛒', '[SHOPPING_CART]'),
        ('🚬', '[CIGARETTE]'),
        ('⚰️', '[COFFIN]'),
        ('⚱️', '[FUNERAL_URN]'),
        ('🗿', '[MOAI]'),
        # Special Unicode sequences that might appear
        ('\U0001f9ea', '[UNIT]'),
        ('\U0001f517', '[INTEGRATION]'), 
        ('\U0001f310', '[SYSTEM]'),
        ('≥', '>='),
        ('≤', '<='),
        ('…', '...'),
        ('–', '-'),
        ('—', '--'),
        (''', "'"),
        (''', "'"),
        ('"', '"'),
        ('"', '"'),
    ]
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for old, new in replacements:
            content = content.replace(old, new)
        
        if content != original_content:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Fixed: {filename}")
            return True
        else:
            print(f"- No changes: {filename}")
            return False
            
    except Exception as e:
        print(f"✗ Error: {filename} - {e}")
        return False

def main():
    """Fix all test files"""
    files = [
        'run_integration_tests.py',
        'run_system_tests.py', 
        'run_all_tests.py'
    ]
    
    print("Fixing Unicode characters...")
    print("=" * 50)
    
    for filename in files:
        fix_file(filename)
    
    print("=" * 50)
    print("Unicode fix completed!")

if __name__ == "__main__":
    main()