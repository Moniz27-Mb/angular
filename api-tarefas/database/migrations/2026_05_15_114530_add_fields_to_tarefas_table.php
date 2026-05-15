<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tarefas', function (Blueprint $table) {
            $table->enum('prioridade', ['baixa', 'media', 'alta'])->default('baixa')->after('descricao');
            $table->date('data_vencimento')->nullable()->after('prioridade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tarefas', function (Blueprint $table) {
            $table->dropColumn(['prioridade', 'data_vencimento']);
        });
    }
};
