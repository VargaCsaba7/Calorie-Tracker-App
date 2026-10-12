"""seed builtin foods

Common foods with Hungarian names. Values are per 100 g, rounded averages based on
USDA FoodData Central (prepared dishes are typical home-cooked recipes, so they vary more).

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-11 21:27:51.855443

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '0005'
down_revision: Union[str, Sequence[str], None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# name, emoji, kcal, protein, carbs, fat (per 100 g), typical serving in g
FOODS = [
    # Grains, bread, potatoes
    ("Fehér rizs (főtt)", "🍚", 130, 2.7, 28.2, 0.3, 180),
    ("Fehér rizs (nyers)", "🍚", 360, 6.6, 79.3, 0.6, 80),
    ("Barna rizs (főtt)", "🍚", 123, 2.7, 25.6, 1.0, 180),
    ("Tészta (főtt)", "🍝", 158, 5.8, 30.9, 0.9, 200),
    ("Tészta (száraz)", "🍝", 371, 13.0, 75.0, 1.5, 100),
    ("Zabpehely", "🥣", 379, 13.2, 67.7, 6.5, 60),
    ("Fehér kenyér", "🍞", 265, 9.0, 49.0, 3.2, 40),
    ("Teljes kiőrlésű kenyér", "🍞", 247, 13.0, 41.0, 3.4, 40),
    ("Zsemle", "🥖", 270, 9.0, 52.0, 2.5, 60),
    ("Búza tortilla", "🌯", 310, 8.0, 51.0, 8.0, 60),
    ("Burgonya (főtt)", "🥔", 87, 1.9, 20.1, 0.1, 200),
    ("Édesburgonya (sült)", "🍠", 90, 2.0, 20.7, 0.2, 200),
    ("Kuszkusz (főtt)", "🍚", 112, 3.8, 23.2, 0.2, 150),
    # Meat, fish, eggs
    ("Csirkemell (nyers)", "🍗", 120, 22.5, 0.0, 2.6, 150),
    ("Csirkemell (sült)", "🍗", 165, 31.0, 0.0, 3.6, 150),
    ("Csirkecomb (sült, bőr nélkül)", "🍗", 209, 26.0, 0.0, 10.9, 150),
    ("Pulykamell (sült)", "🦃", 135, 30.0, 0.0, 1.0, 150),
    ("Darált marhahús (sült)", "🥩", 217, 26.1, 0.0, 11.7, 150),
    ("Marhasteak (sült)", "🥩", 220, 27.0, 0.0, 12.0, 200),
    ("Sertéskaraj (sült)", "🥩", 196, 27.0, 0.0, 9.0, 150),
    ("Főtt sonka", "🥓", 110, 18.0, 1.5, 3.5, 30),
    ("Lazac (sült)", "🐟", 206, 22.0, 0.0, 12.4, 150),
    ("Tonhal konzerv (vízben)", "🐟", 116, 25.5, 0.0, 0.8, 120),
    ("Tojás", "🥚", 143, 12.6, 0.7, 9.5, 55),
    ("Tojásfehérje", "🥚", 52, 10.9, 0.7, 0.2, 33),
    # Dairy
    ("Túró (félzsíros)", "🧀", 106, 15.0, 3.4, 3.7, 100),
    ("Túró (sovány)", "🧀", 74, 13.0, 3.5, 0.5, 100),
    ("Görög joghurt (2%)", "🥛", 73, 9.9, 3.9, 1.9, 150),
    ("Natúr joghurt", "🥛", 61, 3.5, 4.7, 3.3, 150),
    ("Tej (2,8%)", "🥛", 57, 3.3, 4.7, 2.8, 250),
    ("Trappista sajt", "🧀", 345, 25.0, 0.0, 27.0, 30),
    ("Mozzarella", "🧀", 254, 18.0, 2.2, 19.4, 125),
    ("Tejföl (20%)", "🥛", 204, 2.6, 3.4, 20.0, 30),
    ("Vaj", "🧈", 717, 0.9, 0.1, 81.0, 10),
    ("Tejsavófehérje por", "🥤", 400, 80.0, 8.0, 6.0, 30),
    # Fruit
    ("Alma", "🍎", 52, 0.3, 13.8, 0.2, 180),
    ("Banán", "🍌", 89, 1.1, 22.8, 0.3, 120),
    ("Narancs", "🍊", 47, 0.9, 11.8, 0.1, 150),
    ("Körte", "🍐", 57, 0.4, 15.2, 0.1, 180),
    ("Eper", "🍓", 32, 0.7, 7.7, 0.3, 150),
    ("Áfonya", "🫐", 57, 0.7, 14.5, 0.3, 100),
    ("Szőlő", "🍇", 69, 0.7, 18.1, 0.2, 150),
    ("Görögdinnye", "🍉", 30, 0.6, 7.6, 0.2, 300),
    # Vegetables and legumes
    ("Brokkoli (főtt)", "🥦", 35, 2.4, 7.2, 0.4, 150),
    ("Paradicsom", "🍅", 18, 0.9, 3.9, 0.2, 120),
    ("Uborka", "🥒", 15, 0.7, 3.6, 0.1, 150),
    ("Kaliforniai paprika", "🫑", 31, 1.0, 6.0, 0.3, 150),
    ("Sárgarépa", "🥕", 41, 0.9, 9.6, 0.2, 80),
    ("Fejes saláta", "🥬", 15, 1.4, 2.9, 0.2, 50),
    ("Csemegekukorica", "🌽", 86, 3.3, 19.0, 1.2, 100),
    ("Zöldborsó (főtt)", "🫛", 84, 5.4, 15.6, 0.2, 150),
    ("Vöröslencse (főtt)", "🫘", 116, 9.0, 20.0, 0.4, 150),
    ("Csicseriborsó (főtt)", "🫘", 164, 8.9, 27.4, 2.6, 150),
    ("Vörösbab (főtt)", "🫘", 127, 8.7, 22.8, 0.5, 150),
    ("Avokádó", "🥑", 160, 2.0, 8.5, 14.7, 100),
    # Fats, nuts, sweets
    ("Olívaolaj", "🫒", 884, 0.0, 0.0, 100.0, 10),
    ("Napraforgóolaj", "🌻", 884, 0.0, 0.0, 100.0, 10),
    ("Mogyoróvaj", "🥜", 588, 25.0, 20.0, 50.0, 20),
    ("Mandula", "🌰", 579, 21.2, 21.6, 49.9, 30),
    ("Dió", "🌰", 654, 15.2, 13.7, 65.2, 30),
    ("Méz", "🍯", 304, 0.3, 82.4, 0.0, 20),
    ("Kristálycukor", "🍬", 387, 0.0, 100.0, 0.0, 5),
    ("Étcsokoládé (70%)", "🍫", 598, 7.8, 45.9, 42.6, 25),
    ("Tejcsokoládé", "🍫", 535, 7.7, 59.4, 29.7, 25),
    # Hungarian and everyday dishes (typical recipes)
    ("Gulyásleves", "🍲", 75, 5.5, 6.0, 3.5, 400),
    ("Sertéspörkölt", "🍲", 160, 15.0, 3.0, 10.0, 250),
    ("Lecsó", "🍲", 70, 1.5, 6.0, 4.5, 300),
    ("Rántott csirkemell", "🍗", 260, 24.0, 12.0, 13.0, 150),
    ("Palacsinta (töltetlen)", "🥞", 227, 6.4, 28.3, 9.7, 60),
    ("Lángos (sima)", "🫓", 330, 6.5, 42.0, 15.0, 200),
    ("Pizza (margherita)", "🍕", 250, 11.0, 31.0, 9.5, 300),
    ("Hamburger (marhahúsos)", "🍔", 250, 13.0, 25.0, 11.0, 220),
    ("Kakaós csiga", "🥐", 400, 7.0, 52.0, 18.0, 90),
    # Drinks
    ("Narancslé", "🧃", 45, 0.7, 10.4, 0.2, 250),
    ("Kóla", "🥤", 42, 0.0, 10.6, 0.0, 330),
    ("Világos sör", "🍺", 43, 0.5, 3.6, 0.0, 500),
]


def upgrade() -> None:
    foods = sa.table(
        "foods",
        sa.column("name", sa.String),
        sa.column("source", sa.String),
        sa.column("emoji", sa.String),
        sa.column("kcal_100g", sa.Float),
        sa.column("protein_100g", sa.Float),
        sa.column("carbs_100g", sa.Float),
        sa.column("fat_100g", sa.Float),
        sa.column("serving_g", sa.Float),
    )
    op.bulk_insert(
        foods,
        [
            {
                "name": name,
                "source": "builtin",
                "emoji": emoji,
                "kcal_100g": kcal,
                "protein_100g": protein,
                "carbs_100g": carbs,
                "fat_100g": fat,
                "serving_g": serving,
            }
            for name, emoji, kcal, protein, carbs, fat, serving in FOODS
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM foods WHERE source = 'builtin'")
