import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase, Recipe } from '@/lib/supabase';

type Genre = '和食' | '洋食' | '中華';

interface MealPlan {
  mainDish: Recipe | null;
  sideDish: Recipe | null;
  soup: Recipe | null;
}

export default function HomeScreen() {
  const [ingredients, setIngredients] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre>('和食');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState('');

  const genres: Genre[] = ['和食', '洋食', '中華'];

  const suggestMeal = async () => {
    setLoading(true);
    setError('');
    setMealPlan(null);

    try {
      const ingredientList = ingredients
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter((i) => i.length > 0);

      if (ingredientList.length === 0) {
        setError('食材を入力してください');
        setLoading(false);
        return;
      }

      const { data: recipes, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('genre', selectedGenre);

      if (fetchError) throw fetchError;

      if (!recipes || recipes.length === 0) {
        setError('該当するレシピが見つかりませんでした');
        setLoading(false);
        return;
      }

      const findBestMatch = (category: string) => {
        const categoryRecipes = recipes.filter((r) => r.category === category);

        const scored = categoryRecipes.map((recipe) => {
          const matchCount = recipe.ingredients.filter((ing: string) =>
            ingredientList.some((userIng) => ing.toLowerCase().includes(userIng))
          ).length;
          return { recipe, score: matchCount };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.length > 0 ? scored[0].recipe : null;
      };

      setMealPlan({
        mainDish: findBestMatch('主菜'),
        sideDish: findBestMatch('副菜'),
        soup: findBestMatch('汁物'),
      });
    } catch (err) {
      setError('エラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderRecipe = (recipe: Recipe | null, title: string) => {
    if (!recipe) return null;

    return (
      <View style={styles.recipeCard}>
        <Text style={styles.recipeTitle}>{title}</Text>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.sectionLabel}>材料:</Text>
        <Text style={styles.ingredients}>{recipe.ingredients.join('、')}</Text>
        <Text style={styles.sectionLabel}>作り方:</Text>
        <Text style={styles.steps}>{recipe.steps}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>献立提案アプリ</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>冷蔵庫にある食材</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 豚肉,じゃがいも,玉ねぎ"
            value={ingredients}
            onChangeText={setIngredients}
            placeholderTextColor="#999"
          />
          <Text style={styles.hint}>※カンマ区切りで入力してください</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>料理ジャンル</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDropdown(!showDropdown)}>
            <Text style={styles.dropdownText}>{selectedGenre}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.dropdownItem,
                    selectedGenre === genre && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedGenre(genre);
                    setShowDropdown(false);
                  }}>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedGenre === genre && styles.dropdownItemTextActive,
                    ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={suggestMeal}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>献立を提案</Text>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {mealPlan && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>提案された献立</Text>
            {renderRecipe(mealPlan.mainDish, '主菜')}
            {renderRecipe(mealPlan.sideDish, '副菜')}
            {renderRecipe(mealPlan.soup, '汁物')}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemActive: {
    backgroundColor: '#FFF5F2',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  results: {
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  ingredients: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  steps: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
